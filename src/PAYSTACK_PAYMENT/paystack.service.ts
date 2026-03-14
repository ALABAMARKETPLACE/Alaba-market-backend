import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
  HttpException,
  HttpStatus,
  forwardRef,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { catchError, lastValueFrom, map } from "rxjs";
import * as crypto from "crypto";
import { Transaction } from "sequelize";

import {
  PaystackInitializeDto,
  PaystackInitializeResponseDto,
} from "./dto/paystack-initialize.dto";
import {
  PaystackVerifyDto,
  PaystackVerificationResponseDto,
} from "./dto/paystack-verify.dto";
import {
  PaystackRefundDto,
  PaystackRefundResponseDto,
} from "./dto/paystack-refund.dto";
import { PaystackWebhookDto } from "./dto/paystack-webhook.dto";

import { Store } from "../STORE/store.entity";
import { PaymentSplitService } from "../PAYMENT_SPLITS/payment-split.service";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { Order } from "../ORDER/order.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { PaystackGuestInitializeDto } from "./dto/paystack-guest-initialize.dto";
import { PaystackUserInitializeDto } from "./dto/paystack-user-initialize.dto";
import { GuestCheckout } from "./guest-checkout.entity";
import { UserCheckout } from "./user-checkout.entity";
import { GuestOrderService } from "../ORDER/guest-order.service";
import { CreateGuestOrderDto } from "../ORDER/dto/create-guest-order.dto";
import { OrderPlaceService } from "../ORDER/order.place";
import { User } from "../USERS/user.entity";
import { CreateOrderDto } from "../ORDER/dto/createOrder.dto";
import { PaymentTypeEnum } from "../ORDER/dto/payment-type.enum";

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl = "https://api.paystack.co";

  constructor(
    private readonly httpService: HttpService,

    @InjectModel(Store)
    private readonly storeRepository: typeof Store,

    @InjectModel(GuestCheckout)
    private readonly guestCheckoutRepository: typeof GuestCheckout,

    @InjectModel(UserCheckout)
    private readonly userCheckoutRepository: typeof UserCheckout,

    @InjectModel(User)
    private readonly userRepository: typeof User,

    private readonly paymentSplitService: PaymentSplitService,

    @Inject(forwardRef(() => GuestOrderService))
    private readonly guestOrderService: GuestOrderService,

    @Inject(forwardRef(() => OrderPlaceService))
    private readonly orderPlaceService: OrderPlaceService,
  ) {}

  /* ----------------------------------
     HEADERS
  ---------------------------------- */
  private getHeaders() {
    return {
      Authorization: `Bearer ${this.getPaystackSecretKey()}`,
      "Content-Type": "application/json",
    };
  }

  getPublicKey(): string {
    return this.resolvePaystackKey("public");
  }

  private getPaystackSecretKey(): string {
    return this.resolvePaystackKey("secret");
  }

  private resolvePaystackKey(type: "public" | "secret"): string {
    const nodeEnv = (process.env.NODE_ENV || "development").replace(/"/g, "");
    const isDevelopmentLike = nodeEnv !== "production";
    const isSecret = type === "secret";
    const primaryKey = isSecret
      ? process.env.PAYSTACK_SECRET_KEY
      : process.env.PAYSTACK_PUBLIC_KEY;
    const testKey = isSecret
      ? process.env.PAYSTACK_TEST_SECRET_KEY
      : process.env.PAYSTACK_TEST_PUBLIC_KEY;
    const expectedTestPrefix = isSecret ? "sk_test_" : "pk_test_";

    const resolvedKey = isDevelopmentLike
      ? testKey || primaryKey
      : primaryKey || testKey;

    if (!resolvedKey) {
      throw new InternalServerErrorException(
        `Missing Paystack ${type} key configuration.`,
      );
    }

    if (isDevelopmentLike && !resolvedKey.startsWith(expectedTestPrefix)) {
      throw new InternalServerErrorException(
        `Development must use Paystack test ${type} keys. Set ${
          isSecret ? "PAYSTACK_TEST_SECRET_KEY" : "PAYSTACK_TEST_PUBLIC_KEY"
        } or switch PAYSTACK_${type.toUpperCase()}_KEY to a test key.`,
      );
    }

    return resolvedKey;
  }

  /* ----------------------------------
     INITIALIZE PAYMENT
  ---------------------------------- */
  async initializePayment(
    initData: PaystackInitializeDto,
  ): Promise<any> {
    const amountInKobo = Number(initData.amount);
    if (amountInKobo < 100) {
      throw new HttpException(
        "Amount must be at least 100 kobo",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (initData.split_payment && initData.order_id) {
      return this.initializeWithSplit(initData);
    }

    if (initData.split_payment) {
      throw new HttpException(
        "Order ID is required for split payments",
        HttpStatus.BAD_REQUEST,
      );
    }

    const payload = {
      email: initData.email,
      amount: amountInKobo,
      currency: initData.currency || "NGN",
      callback_url: initData.callback_url,
      reference: initData.reference || this.generateReference(),
      metadata: {
        ...initData.metadata,
        order_id: initData.order_id,
        store_id: initData.store_id,
      },
    };

    const response = await lastValueFrom(
      this.httpService
        .post(`${this.baseUrl}/transaction/initialize`, payload, {
          headers: this.getHeaders(),
        })
        .pipe(
          map((r) => r.data),
          catchError((err) => {
            throw new HttpException(
              err.response?.data?.message || "Initialization failed",
              err.response?.status || HttpStatus.BAD_REQUEST,
            );
          }),
        ),
    );

    return response.data;
  }

  async initializeAuthenticatedCheckout(
    userId: number,
    initData: PaystackUserInitializeDto,
  ): Promise<any> {
    const user = await this.userRepository.findByPk(userId);

    if (!user || !user.email) {
      throw new BadRequestException("Authenticated user not found");
    }

    const preparedCheckout = await this.orderPlaceService.prepareAuthenticatedCheckout(
      userId,
      initData.order_payload,
    );
    const reference = initData.reference || this.generateReference();

    const payload = {
      email: user.email,
      amount: preparedCheckout.amount_kobo,
      currency: "NGN",
      reference,
      callback_url:
        initData.callback_url ||
        `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: {
        ...initData.metadata,
        checkout_type: "authenticated_order",
        user_id: userId,
        store_ids: preparedCheckout.store_ids,
        order_count: preparedCheckout.store_ids.length,
      },
      channels: ["card", "bank", "ussd", "mobile_money"],
    };

    const response = await firstValueFrom(
      this.httpService
        .post(`${this.baseUrl}/transaction/initialize`, payload, {
          headers: this.getHeaders(),
        })
        .pipe(map((r) => r.data)),
    );

    if (!response.status) {
      throw new BadRequestException(
        response.message || "Payment initialization failed",
      );
    }

    await this.persistUserCheckoutInitialization(
      reference,
      user,
      initData,
      preparedCheckout,
    );

    return {
      status: true,
      message: "Payment initialized for checkout",
      data: {
        authorization_url: response.data.authorization_url,
        access_code: response.data.access_code,
        reference: response.data.reference,
        amount: preparedCheckout.amount,
      },
    };
  }

  /* ----------------------------------
     SPLIT PAYMENT
  ---------------------------------- */
  async initializeSplitTransaction(initData: {
    email: string;
    amount: number;
    admin_amount?: number;
    callback_url: string;
    reference?: string;
    store_id: number;
    order_id?: number;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const store = await this.storeRepository.findByPk(initData.store_id);
    if (!store || !store.paystack_subaccount_code) {
      throw new HttpException(
        "Invalid store subaccount",
        HttpStatus.BAD_REQUEST,
      );
    }

    const amountInKobo = Number(initData.amount);
    if (amountInKobo < 100) {
      throw new HttpException(
        "Amount must be at least 100 kobo",
        HttpStatus.BAD_REQUEST,
      );
    }

    const adminAmount =
      initData.admin_amount !== undefined
        ? Number(initData.admin_amount)
        : Math.round(amountInKobo * 0.05);

    const payload = {
      email: initData.email,
      amount: amountInKobo,
      subaccount: store.paystack_subaccount_code,
      transaction_charge: adminAmount,
      bearer: "account",
      reference: initData.reference || this.generateReference(),
      callback_url: initData.callback_url,
      metadata: {
        ...initData.metadata,
        order_id: initData.order_id,
        store_id: initData.store_id,
      },
    };

    const response = await lastValueFrom(
      this.httpService
        .post(`${this.baseUrl}/transaction/initialize`, payload, {
          headers: this.getHeaders(),
        })
        .pipe(
          map((r) => r.data),
          catchError((err) => {
            throw new HttpException(
              err.response?.data?.message || "Split initialization failed",
              err.response?.status || HttpStatus.BAD_REQUEST,
            );
          }),
        ),
    );

    return response.data;
  }

  private async initializeWithSplit(
    initData: PaystackInitializeDto,
  ): Promise<any> {
    if (!initData.order_id) {
      throw new HttpException(
        "Order ID is required for split payments",
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.paymentSplitService.processPaymentWithSplit(
      initData.order_id,
      initData,
    );

    return result.paystack;
  }

  /* ----------------------------------
     VERIFY PAYMENT
  ---------------------------------- */
  async verifyPayment(
    verifyData: PaystackVerifyDto,
  ): Promise<PaystackVerificationResponseDto> {
    const response = await lastValueFrom(
      this.httpService
        .get(`${this.baseUrl}/transaction/verify/${verifyData.reference}`, {
          headers: this.getHeaders(),
        })
        .pipe(map((r) => r.data)),
    );

    return response;
  }

  /* ----------------------------------
     WEBHOOK SIGNATURE
  ---------------------------------- */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac("sha512", this.getPaystackSecretKey())
      .update(payload)
      .digest("hex");

    return hash === signature;
  }

  /* ----------------------------------
     WEBHOOK ENTRY
  ---------------------------------- */
  async processWebhook(
    webhookData: PaystackWebhookDto,
    signature: string,
    rawPayload: string,
  ): Promise<{ status: string; message: string }> {
    if (!this.verifyWebhookSignature(rawPayload, signature)) {
      throw new HttpException(
        "Invalid webhook signature",
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (webhookData.event === "charge.success") {
      await this.handleSuccessfulPayment(webhookData.data);
    }

    if (webhookData.event === "charge.failed") {
      await this.handleFailedPayment(webhookData.data);
    }

    this.logger.log(
      `Processed Paystack webhook event "${webhookData.event}" for ${webhookData.data?.reference ?? "unknown-reference"}`,
    );

    return {
      status: "ok",
      message: "Webhook processed",
    };
  }

  /* ----------------------------------
     SUCCESS HANDLER
  ---------------------------------- */
  private async handleSuccessfulPayment(paymentData: any): Promise<void> {
    await this.handlePaymentWebhookEvent(paymentData, "success");
  }

  /* ----------------------------------
     FAILED HANDLER
  ---------------------------------- */
  private async handleFailedPayment(paymentData: any): Promise<void> {
    await this.handlePaymentWebhookEvent(paymentData, "failed");
  }

  /* ----------------------------------------------------
   GET TRANSACTION DETAILS
---------------------------------------------------- */
  async getTransactionDetails(reference: string): Promise<DataResponseDto> {
    const response = await lastValueFrom(
      this.httpService
        .get(`${this.baseUrl}/transaction/verify/${reference}`, {
          headers: this.getHeaders(),
        })
        .pipe(map((r) => r.data)),
    );

    return new DataResponseDto(
      response,
      true,
      "Transaction details retrieved",
    );
  }

  /* ----------------------------------------------------
   LIST TRANSACTIONS
---------------------------------------------------- */
  async listTransactions(page = 1, perPage = 50): Promise<DataResponseDto> {
    const response = await lastValueFrom(
      this.httpService
        .get(`${this.baseUrl}/transaction?page=${page}&perPage=${perPage}`, {
          headers: this.getHeaders(),
        })
        .pipe(map((r) => r.data)),
    );

    return new DataResponseDto(
      response.data,
      true,
      "Transactions fetched successfully",
    );
  }
  /* ----------------------------------
     REFUND
  ---------------------------------- */
  async createRefund(
    refundData: PaystackRefundDto,
  ): Promise<PaystackRefundResponseDto> {
    const payload = {
      transaction: refundData.transaction,
      amount: refundData.amount,
      currency: refundData.currency || "NGN",
      customer_note: refundData.reason,
      merchant_note: refundData.reason,
    };

    const response = await lastValueFrom(
      this.httpService
        .post(`${this.baseUrl}/refund`, payload, {
          headers: this.getHeaders(),
        })
        .pipe(map((r) => r.data)),
    );

    return response.data;
  }

  /* ----------------------------------
     HELPERS
  ---------------------------------- */
  private generateReference(): string {
    return `alaba_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  async verifyPaymentByReference(reference: string) {
    return this.verifyPayment({ reference });
  }

  private async handlePaymentWebhookEvent(
    paymentData: any,
    paymentStatus: "success" | "failed",
  ): Promise<void> {
    const reference = paymentData?.reference;

    if (!reference) {
      this.logger.warn("Received Paystack webhook without a transaction reference");
      return;
    }

    const guestOrderIds = await this.syncGuestCheckoutFromWebhook(
      reference,
      paymentData,
      paymentStatus,
    );
    const userOrderIds = await this.syncUserCheckoutFromWebhook(
      reference,
      paymentData,
      paymentStatus,
    );

    await OrderPayments.sequelize.transaction(async (t: Transaction) => {
      const orders = await this.findOrdersForWebhook(
        reference,
        paymentData,
        [...guestOrderIds, ...userOrderIds],
        t,
      );

      if (orders.length === 0) {
        this.logger.warn(
          `No order/payment record found for Paystack reference ${reference}`,
        );
        return;
      }

      for (const order of orders) {
        const payment = await this.findOrCreatePaymentForOrder(
          order,
          reference,
          paymentData,
          t,
        );

        if (payment.status === "success" && paymentStatus === "success") {
          continue;
        }

        await payment.update(
          {
            status: paymentStatus,
            ref: reference,
            currency: paymentData.currency || payment.currency || "NGN",
            cardHolder:
              paymentData.customer?.email ||
              payment.cardHolder ||
              order.guest_email ||
              null,
            amount: Math.round(Number(order.grandTotal || 0) * 100),
          },
          { transaction: t },
        );

        const nextOrderStatus = this.getOrderStatusForPayment(
          order,
          paymentStatus,
        );
        if (nextOrderStatus && nextOrderStatus !== order.status) {
          await order.update({ status: nextOrderStatus }, { transaction: t });
        }

        await this.createOrderStatusIfNeeded(
          order.id,
          nextOrderStatus || order.status,
          this.getOrderStatusRemark(paymentStatus),
          t,
        );
      }
    });

    await this.paymentSplitService.syncPaymentStatusFromWebhook(
      reference,
      paymentData,
    );
  }

  private async findOrdersForWebhook(
    reference: string,
    paymentData: any,
    checkoutOrderIds: number[],
    transaction: Transaction,
  ): Promise<Order[]> {
    const orders = new Map<number, Order>();

    const addOrder = (order: Order | null) => {
      if (order?.id) {
        orders.set(order.id, order);
      }
    };

    for (const checkoutOrderId of checkoutOrderIds) {
      const order = await Order.findByPk(checkoutOrderId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      addOrder(order);
    }

    const metadataOrderId = Number(paymentData?.metadata?.order_id);

    if (Number.isFinite(metadataOrderId) && metadataOrderId > 0) {
      addOrder(
        await Order.findByPk(metadataOrderId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        }),
      );
      addOrder(
        await Order.findOne({
          where: { order_id: metadataOrderId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        }),
      );
    }

    if (reference) {
      const paymentsByReference = await OrderPayments.findAll({
        where: { ref: reference },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      for (const payment of paymentsByReference) {
        if (payment?.orderId) {
          addOrder(
            await Order.findByPk(payment.orderId, {
              transaction,
              lock: transaction.LOCK.UPDATE,
            }),
          );
        }
      }

      const ordersByReference = await Order.findAll({
        where: { payment_reference: reference },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      for (const order of ordersByReference) {
        addOrder(order);
      }
    }

    return [...orders.values()];
  }

  private async findOrCreatePaymentForOrder(
    order: Order,
    reference: string,
    paymentData: any,
    transaction: Transaction,
  ): Promise<OrderPayments> {
    const existingPayment = await OrderPayments.findOne({
      where: { orderId: order.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (existingPayment) {
      if (existingPayment.ref !== reference) {
        await existingPayment.update({ ref: reference }, { transaction });
      }
      return existingPayment;
    }

    return OrderPayments.create(
      {
        orderId: order.id,
        paymentType: order.paymentType || "pay-online",
        status: "pending",
        ref: reference,
        currency: paymentData.currency || "NGN",
        amount: Math.round(Number(order.grandTotal || 0) * 100),
        cardHolder:
          paymentData.customer?.email || order.guest_email || null,
      },
      { transaction },
    );
  }

  private getOrderStatusForPayment(
    order: Order,
    paymentStatus: "success" | "failed",
  ): string | null {
    const terminalStatuses = new Set([
      "cancelled",
      "delivered",
      "rejected",
      "picked_up",
    ]);

    if (terminalStatuses.has(order.status)) {
      return null;
    }

    if (paymentStatus === "success") {
      return "processing";
    }

    return "failed";
  }

  private getOrderStatusRemark(paymentStatus: "success" | "failed"): string {
    return paymentStatus === "success"
      ? "Payment confirmed via Paystack webhook."
      : "Payment failed via Paystack webhook.";
  }

  private async createOrderStatusIfNeeded(
    orderId: number,
    status: string,
    remark: string,
    transaction: Transaction,
  ): Promise<void> {
    const latestStatus = await OrderStatus.findOne({
      where: { orderId },
      order: [["createdAt", "DESC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (latestStatus?.status === status && latestStatus?.remark === remark) {
      return;
    }

    await OrderStatus.create(
      {
        orderId,
        status,
        remark,
      },
      { transaction },
    );
  }

  private async syncGuestCheckoutFromWebhook(
    reference: string,
    paymentData: any,
    paymentStatus: "success" | "failed",
  ): Promise<number[]> {
    const guestCheckout = await this.guestCheckoutRepository.findOne({
      where: { reference },
    });

    if (!guestCheckout) {
      return [];
    }

    if (paymentStatus === "failed") {
      await guestCheckout.update({
        payment_status: "failed",
        status:
          guestCheckout.status === "completed" ? guestCheckout.status : "failed",
        webhook_payload: paymentData,
        error: paymentData?.gateway_response || "Payment failed via webhook",
      });
      return this.normalizeOrderIds(guestCheckout.order_ids);
    }

    if (guestCheckout.status === "completed") {
      await guestCheckout.update({
        payment_status: "success",
        webhook_payload: paymentData,
        error: null,
      });
      return this.normalizeOrderIds(guestCheckout.order_ids);
    }

    if (!guestCheckout.payload) {
      await guestCheckout.update({
        payment_status: "success",
        status: "payment_confirmed",
        webhook_payload: paymentData,
        error: null,
      });
      return this.normalizeOrderIds(guestCheckout.order_ids);
    }

    await guestCheckout.update({
      payment_status: "success",
      status: "processing",
      webhook_payload: paymentData,
      error: null,
    });

    try {
      const payload = this.buildGuestOrderPayload(
        guestCheckout.payload,
        reference,
      );
      const result = await this.guestOrderService.createGuestOrder(payload, {
        skipPaymentVerification: true,
        verifiedPaymentData: paymentData,
      });
      const orders = Array.isArray(result?.data) ? result.data : [];

      await guestCheckout.update({
        status: "completed",
        processed_at: new Date(),
        order_ids: orders.map((order: any) => order.id),
        error: null,
      });
      return orders.map((order: any) => Number(order.id)).filter(Boolean);
    } catch (error) {
      await guestCheckout.update({
        status: "failed",
        error: error?.message || "Guest checkout finalization failed",
      });
      throw error;
    }
  }

  private async syncUserCheckoutFromWebhook(
    reference: string,
    paymentData: any,
    paymentStatus: "success" | "failed",
  ): Promise<number[]> {
    const userCheckout = await this.userCheckoutRepository.findOne({
      where: { reference },
    });

    if (!userCheckout) {
      return [];
    }

    if (paymentStatus === "failed") {
      await userCheckout.update({
        payment_status: "failed",
        status:
          userCheckout.status === "completed" ? userCheckout.status : "failed",
        webhook_payload: paymentData,
        error: paymentData?.gateway_response || "Payment failed via webhook",
      });
      return this.normalizeOrderIds(userCheckout.order_ids);
    }

    if (userCheckout.status === "completed") {
      await userCheckout.update({
        payment_status: "success",
        webhook_payload: paymentData,
        error: null,
      });
      return this.normalizeOrderIds(userCheckout.order_ids);
    }

    const storedPayload = userCheckout.payload || {};
    if (!storedPayload?.order_payload || !storedPayload?.verified_delivery) {
      await userCheckout.update({
        payment_status: "success",
        status: "payment_confirmed",
        webhook_payload: paymentData,
        error: null,
      });
      return this.normalizeOrderIds(userCheckout.order_ids);
    }

    await userCheckout.update({
      payment_status: "success",
      status: "processing",
      webhook_payload: paymentData,
      error: null,
    });

    try {
      const payload = this.buildAuthenticatedOrderPayload(
        storedPayload.order_payload,
        reference,
      );
      const result = await this.orderPlaceService.create(
        Number(userCheckout.user_id),
        payload,
        {
          skipDeliveryTokenVerification: true,
          verifiedChargesData: storedPayload.verified_delivery,
        },
      );
      const orders = Array.isArray(result?.data) ? result.data : [];
      const orderIds = orders
        .map((entry: any) => Number(entry?.newOrder?.id))
        .filter(Boolean);

      await userCheckout.update({
        status: "completed",
        processed_at: new Date(),
        order_ids: orderIds,
        error: null,
      });

      return orderIds;
    } catch (error) {
      await userCheckout.update({
        status: "failed",
        error: error?.message || "Authenticated checkout finalization failed",
      });
      throw error;
    }
  }

  private normalizeOrderIds(orderIds: any): number[] {
    if (!Array.isArray(orderIds)) {
      return [];
    }

    return orderIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  }

  private buildGuestOrderPayload(
    payload: CreateGuestOrderDto,
    reference: string,
  ): CreateGuestOrderDto {
    return {
      ...payload,
      payment: {
        ...payload.payment,
        payment_reference: reference,
        transaction_reference:
          payload.payment?.transaction_reference || reference,
        payment_status: "success",
      },
    };
  }

  private buildAuthenticatedOrderPayload(
    payload: CreateOrderDto,
    reference: string,
  ): CreateOrderDto {
    return {
      ...payload,
      payment: {
        ...(payload.payment || ({} as CreateOrderDto["payment"])),
        ref: reference,
        type: payload?.payment?.type || PaymentTypeEnum.Paystack,
      },
    };
  }

  private async persistGuestCheckoutInitialization(
    reference: string,
    guestData: PaystackGuestInitializeDto,
    amountInKobo: number,
  ) {
    const payload = guestData.order_payload
      ? this.buildGuestOrderPayload(guestData.order_payload, reference)
      : null;

    await this.guestCheckoutRepository.create({
      reference,
      guest_email: guestData.guest_info.email.toLowerCase().trim(),
      amount_kobo: amountInKobo,
      payload,
      status: payload ? "ready_for_webhook" : "awaiting_frontend_confirmation",
      payment_status: "pending",
    });
  }

  private async persistUserCheckoutInitialization(
    reference: string,
    user: User,
    initData: PaystackUserInitializeDto,
    preparedCheckout: {
      verified: any;
      amount_kobo: number;
      store_ids: number[];
    },
  ) {
    await this.userCheckoutRepository.create({
      reference,
      user_id: user._id,
      user_email: user.email.toLowerCase().trim(),
      amount_kobo: preparedCheckout.amount_kobo,
      payload: {
        order_payload: this.buildAuthenticatedOrderPayload(
          initData.order_payload,
          reference,
        ),
        verified_delivery: preparedCheckout.verified,
        store_ids: preparedCheckout.store_ids,
      },
      status: "ready_for_webhook",
      payment_status: "pending",
    });
  }

  // ==================== GUEST PAYMENT INITIALIZATION ====================

  /* ==================== GUEST PAYMENT INITIALIZATION ==================== */

  async initializeGuestPayment(
    guestData: PaystackGuestInitializeDto,
  ): Promise<any> {
    try {
      this.logger.log(
        `Initializing guest payment for ${guestData.guest_info.email}`,
      );

      // Generate unique reference for guest payment
      const reference = `guest_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;

      // Calculate total amount (cart total + delivery)
      const totalAmount = guestData.amount + guestData.delivery_charge;

      // Extract store IDs for split payment (if multi-seller)
      const storeIds = [
        ...new Set(
          guestData.cart_items
            .map((item) => item.store_id)
            .filter((value) => value != null),
        ),
      ];
      const isMultiSeller = storeIds.length > 1;

      // Build metadata
      const metadata = {
        custom_fields: [
          {
            display_name: "Guest Name",
            variable_name: "guest_name",
            value: `${guestData.guest_info.first_name} ${guestData.guest_info.last_name}`,
          },
          {
            display_name: "Guest Phone",
            variable_name: "guest_phone",
            value: guestData.guest_info.phone,
          },
          {
            display_name: "Order Type",
            variable_name: "order_type",
            value: "guest_order",
          },
          {
            display_name: "Multi-Seller",
            variable_name: "is_multi_seller",
            value: isMultiSeller ? "Yes" : "No",
          },
        ],
        cart_items: guestData.cart_items,
        delivery_charge: guestData.delivery_charge,
        store_ids: storeIds,
        is_multi_seller: isMultiSeller,
        ...guestData.metadata,
      };

      // Prepare Paystack request
      const paystackPayload = {
        email: guestData.guest_info.email,
        amount: totalAmount, // Already in kobo
        currency: "NGN",
        reference,
        callback_url:
          guestData.callback_url ||
          `${process.env.FRONTEND_URL}/guest/payment/callback`,
        metadata,
        channels: ["card", "bank", "ussd", "mobile_money"], // All payment channels
      };

      // Call Paystack API using firstValueFrom
      const response = await firstValueFrom(
        this.httpService
          .post(`${this.baseUrl}/transaction/initialize`, paystackPayload, {
            headers: this.getHeaders(), // ✅ Use getHeaders() method
          })
          .pipe(map((r) => r.data)), // ✅ Extract data from response
      );

      // ✅ Check response.status (not response.data.status)
      if (!response.status) {
        throw new BadRequestException(
          response.message || "Payment initialization failed",
        );
      }

      await this.persistGuestCheckoutInitialization(
        reference,
        guestData,
        totalAmount,
      );

      this.logger.log(`Guest payment initialized: ${reference}`); // ✅ FIXED: Added opening parenthesis

      return {
        status: true,
        message: "Payment initialized for guest checkout",
        data: {
          authorization_url: response.data.authorization_url,
          access_code: response.data.access_code,
          reference: response.data.reference,
          amount: totalAmount / 100, // Convert back to Naira for display
        },
      };
    } catch (error) {
      this.logger.error(
        `Guest payment initialization failed: ${error.message}`,
      );

      // ✅ Better error handling
      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException(
        error.response?.data?.message ||
          error.message ||
          "Failed to initialize payment",
      );
    }
  }

  // GUEST USER DATA ENDS HERE
}
