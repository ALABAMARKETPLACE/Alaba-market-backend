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
import { GuestCheckout } from "./guest-checkout.entity";
import { GuestOrderService } from "../ORDER/guest-order.service";
import { CreateGuestOrderDto } from "../ORDER/dto/create-guest-order.dto";

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

    private readonly paymentSplitService: PaymentSplitService,

    @Inject(forwardRef(() => GuestOrderService))
    private readonly guestOrderService: GuestOrderService,
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

    if (initData.split_payment && initData.store_id) {
      return this.initializeWithSplit(initData);
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

  /* ----------------------------------
     SPLIT PAYMENT
  ---------------------------------- */
  private async initializeWithSplit(
    initData: PaystackInitializeDto,
  ): Promise<any> {
    const store = await this.storeRepository.findByPk(initData.store_id);
    if (!store || !store.paystack_subaccount_code) {
      throw new HttpException(
        "Invalid store subaccount",
        HttpStatus.BAD_REQUEST,
      );
    }

    const amountInKobo = Number(initData.amount);
    const adminAmount = Math.round(amountInKobo * 0.05);

    if (initData.order_id) {
      await this.paymentSplitService.createPaymentSplit(
        initData.order_id,
        amountInKobo / 100,
      );
    }

    const payload = {
      email: initData.email,
      amount: amountInKobo,
      subaccount: store.paystack_subaccount_code,
      transaction_charge: adminAmount,
      bearer: "account",
      reference: initData.reference || this.generateReference(),
      callback_url: initData.callback_url,
      metadata: {
        order_id: initData.order_id,
        store_id: initData.store_id,
      },
    };

    const response = await lastValueFrom(
      this.httpService
        .post(`${this.baseUrl}/transaction/initialize`, payload, {
          headers: this.getHeaders(),
        })
        .pipe(map((r) => r.data)),
    );

    return response.data;
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

    await this.syncGuestCheckoutFromWebhook(reference, paymentData, paymentStatus);

    await OrderPayments.sequelize.transaction(async (t: Transaction) => {
      const payment = await this.findOrCreatePaymentForWebhook(
        reference,
        paymentData,
        t,
      );

      if (!payment) {
        this.logger.warn(
          `No order/payment record found for Paystack reference ${reference}`,
        );
        return;
      }

      const order = await Order.findByPk(payment.orderId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!order) {
        this.logger.warn(
          `Payment ${reference} is linked to a missing order ${payment.orderId}`,
        );
        return;
      }

      if (payment.status === "success") {
        return;
      }

      if (payment.status === paymentStatus) {
        return;
      }

      await payment.update(
        {
          status: paymentStatus,
          ref: payment.ref || reference,
          currency: paymentData.currency || payment.currency || "NGN",
          cardHolder:
            paymentData.customer?.email ||
            payment.cardHolder ||
            order.guest_email ||
            null,
          amount:
            typeof paymentData.amount === "number"
              ? paymentData.amount
              : Math.round(Number(order.grandTotal || 0) * 100),
        },
        { transaction: t },
      );

      const nextOrderStatus = this.getOrderStatusForPayment(order, paymentStatus);
      if (nextOrderStatus && nextOrderStatus !== order.status) {
        await order.update({ status: nextOrderStatus }, { transaction: t });
      }

      await this.createOrderStatusIfNeeded(
        order.id,
        nextOrderStatus || order.status,
        this.getOrderStatusRemark(paymentStatus),
        t,
      );
    });

    await this.paymentSplitService.syncPaymentStatusFromWebhook(
      reference,
      paymentData,
    );
  }

  private async findOrCreatePaymentForWebhook(
    reference: string,
    paymentData: any,
    transaction: Transaction,
  ): Promise<OrderPayments | null> {
    const existingPayment = await OrderPayments.findOne({
      where: { ref: reference },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (existingPayment) {
      return existingPayment;
    }

    const order = await this.findOrderForWebhook(paymentData, transaction);
    if (!order) {
      return null;
    }

    const orderPayment = await OrderPayments.findOne({
      where: { orderId: order.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (orderPayment) {
      if (!orderPayment.ref) {
        await orderPayment.update({ ref: reference }, { transaction });
      }
      return orderPayment;
    }

    return OrderPayments.create(
      {
        orderId: order.id,
        paymentType: order.paymentType || "pay-online",
        status: "pending",
        ref: reference,
        currency: paymentData.currency || "NGN",
        amount:
          typeof paymentData.amount === "number"
            ? paymentData.amount
            : Math.round(Number(order.grandTotal || 0) * 100),
        cardHolder:
          paymentData.customer?.email || order.guest_email || null,
      },
      { transaction },
    );
  }

  private async findOrderForWebhook(
    paymentData: any,
    transaction: Transaction,
  ): Promise<Order | null> {
    const metadataOrderId = Number(paymentData?.metadata?.order_id);

    if (Number.isFinite(metadataOrderId) && metadataOrderId > 0) {
      const orderByPrimaryKey = await Order.findByPk(metadataOrderId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (orderByPrimaryKey) {
        return orderByPrimaryKey;
      }

      const orderByBusinessId = await Order.findOne({
        where: { order_id: metadataOrderId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (orderByBusinessId) {
        return orderByBusinessId;
      }
    }

    if (paymentData?.reference) {
      const orderByReference = await Order.findOne({
        where: { payment_reference: paymentData.reference },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (orderByReference) {
        return orderByReference;
      }
    }

    return null;
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
  ): Promise<void> {
    const guestCheckout = await this.guestCheckoutRepository.findOne({
      where: { reference },
    });

    if (!guestCheckout) {
      return;
    }

    if (paymentStatus === "failed") {
      await guestCheckout.update({
        payment_status: "failed",
        status:
          guestCheckout.status === "completed" ? guestCheckout.status : "failed",
        webhook_payload: paymentData,
        error: paymentData?.gateway_response || "Payment failed via webhook",
      });
      return;
    }

    if (guestCheckout.status === "completed") {
      await guestCheckout.update({
        payment_status: "success",
        webhook_payload: paymentData,
        error: null,
      });
      return;
    }

    if (!guestCheckout.payload) {
      await guestCheckout.update({
        payment_status: "success",
        status: "payment_confirmed",
        webhook_payload: paymentData,
        error: null,
      });
      return;
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
    } catch (error) {
      await guestCheckout.update({
        status: "failed",
        error: error?.message || "Guest checkout finalization failed",
      });
      throw error;
    }
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
