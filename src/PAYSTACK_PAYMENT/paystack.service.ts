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
import { Op, Transaction } from "sequelize";

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
import { ReconcilePaystackTransactionsDto } from "./dto/reconcile-paystack-transactions.dto";
import { ManualSettlementAuditDto } from "./dto/manual-settlement-audit.dto";
import { PaymentLog } from "../PAYMENT_LOG/paymentlog.entity";
import { JwtService } from "@nestjs/jwt";
import { OrderLog } from "../ORDER_LOG/orderlog.entity";
import { PaystackAccountConfigService } from "./paystack-account-config.service";
import {
  PaystackAccountType,
  resolveStoreSubaccountSelection,
} from "../shared/helpers/paystack-subaccount.helper";
import { OrderItems } from "../ORDER_ITEMS/order_items.entity";

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl = "https://api.paystack.co";

  constructor(
    private readonly httpService: HttpService,
    private readonly paystackAccountConfigService: PaystackAccountConfigService,

    @InjectModel(Store)
    private readonly storeRepository: typeof Store,

    @InjectModel(GuestCheckout)
    private readonly guestCheckoutRepository: typeof GuestCheckout,

    @InjectModel(UserCheckout)
    private readonly userCheckoutRepository: typeof UserCheckout,

    @InjectModel(User)
    private readonly userRepository: typeof User,

    @InjectModel(PaymentLog)
    private readonly paymentLogRepository: typeof PaymentLog,

    private readonly paymentSplitService: PaymentSplitService,
    private readonly jwtService: JwtService,

    @Inject(forwardRef(() => GuestOrderService))
    private readonly guestOrderService: GuestOrderService,

    @Inject(forwardRef(() => OrderPlaceService))
    private readonly orderPlaceService: OrderPlaceService,
  ) {}

  /* ----------------------------------
     HEADERS
  ---------------------------------- */
  private getHeaders(account: PaystackAccountType = "default") {
    return this.paystackAccountConfigService.getHeaders(account);
  }

  getPublicKey(): string {
    return this.paystackAccountConfigService.getPublicKey();
  }

  async getManualSettlementAudit(
    query: ManualSettlementAuditDto,
  ): Promise<DataResponseDto> {
    const orderWhere: any = {};
    const paymentWhere: any = {
      [Op.or]: [
        { requires_manual_settlement: true },
        { collection_mode: "company_account_no_subaccount" },
        { collection_mode: { [Op.is]: null } },
      ],
    };

    if (query.storeId) {
      orderWhere.storeId = query.storeId;
    }

    if (query.reference) {
      paymentWhere.ref = query.reference.trim();
    }

    if (query.buyerEmail) {
      const normalizedEmail = query.buyerEmail.trim().toLowerCase();
      orderWhere[Op.or] = [
        { guest_email: normalizedEmail },
        { "$userDetails.email$": normalizedEmail },
      ];
    }

    const { rows, count } = await Order.findAndCountAll({
      where: orderWhere,
      include: [
        {
          model: OrderPayments,
          as: "orderPayment",
          required: true,
          where: paymentWhere,
        },
        {
          model: User,
          as: "userDetails",
          required: false,
          attributes: [
            "_id",
            "name",
            "first_name",
            "last_name",
            "email",
            "phone",
            "image",
          ],
        },
        {
          model: Store,
          as: "storeDetails",
          required: false,
          attributes: [
            "id",
            "name",
            "store_name",
            "email",
            "phone",
            "business_address",
            "logo_upload",
            "slug",
          ],
        },
        {
          model: OrderItems,
          as: "orderItems",
          required: false,
          attributes: [
            "id",
            "productId",
            "variantId",
            "quantity",
            "price",
            "totalPrice",
            "image",
            "name",
            "sku",
            "combination",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: query.limit,
      offset: query.offset,
      distinct: true,
      subQuery: false,
    });

    const data = rows.map((order: any) => ({
      id: order.id,
      order_id: order.order_id,
      status: order.status,
      is_guest_order: order.is_guest_order,
      totalItems: order.totalItems,
      total: order.total,
      discount: order.discount,
      deliveryCharge: order.deliveryCharge,
      tax: order.tax,
      grandTotal: order.grandTotal,
      createdAt: order.createdAt,
      buyer: order.is_guest_order
        ? {
            type: "guest",
            name: `${order.guest_first_name || ""} ${
              order.guest_last_name || ""
            }`.trim(),
            email: order.guest_email,
            phone: order.guest_phone,
            country_code: order.guest_country_code || null,
          }
        : {
            type: "user",
            id: order.userDetails?._id || order.userDetails?.id || null,
            name: order.userDetails?.name || null,
            first_name: order.userDetails?.first_name || null,
            last_name: order.userDetails?.last_name || null,
            email: order.userDetails?.email || null,
            phone: order.userDetails?.phone || null,
            image: order.userDetails?.image || null,
          },
      store: order.storeDetails,
      items: order.orderItems || [],
      payment: {
        id: order.orderPayment?.id,
        paymentType: order.orderPayment?.paymentType,
        status: order.orderPayment?.status,
        ref: order.orderPayment?.ref,
        amount: order.orderPayment?.amount,
        currency: order.orderPayment?.currency,
        split_payment_applied:
          order.orderPayment?.collection_mode === "store_subaccount",
        collection_mode: order.orderPayment?.collection_mode,
        paystack_account_used: order.orderPayment?.paystack_account_used,
        requires_manual_settlement:
          order.orderPayment?.requires_manual_settlement,
        manual_settlement_reason:
          order.orderPayment?.manual_settlement_reason,
      },
    }));

    return new DataResponseDto(
      data,
      true,
      "Non-split payment audit records retrieved successfully",
      {
        page: query.page,
        take: query.take,
      } as any,
      count,
    );
  }

  /* ----------------------------------
     INITIALIZE PAYMENT
  ---------------------------------- */
  async initializePayment(initData: PaystackInitializeDto): Promise<any> {
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

    if (await this.shouldAutoSplitExistingOrder(initData.order_id)) {
      return this.initializeWithSplit({
        ...initData,
        split_payment: true,
      });
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

    const preparedCheckout =
      await this.orderPlaceService.prepareAuthenticatedCheckout(
        userId,
        initData.order_payload,
      );
    this.assertSingleStoreSplitOnly(preparedCheckout.store_ids);
    const reference = initData.reference || this.generateReference();
    const storeForSplit = await this.getEligibleSingleStoreForSplit(
      preparedCheckout.store_ids,
    );
    const resolvedStoreSubaccount = storeForSplit
      ? resolveStoreSubaccountSelection(storeForSplit)
      : null;

    const payload = {
      email: user.email,
      amount: preparedCheckout.amount_kobo,
      currency: "NGN",
      reference,
      callback_url:
        initData.callback_url || `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: {
        ...initData.metadata,
        checkout_type: "authenticated_order",
        user_id: userId,
        store_ids: preparedCheckout.store_ids,
        order_count: preparedCheckout.store_ids.length,
        split_payment_applied: Boolean(storeForSplit),
        split_payment_mode: storeForSplit
          ? "single_store_checkout"
          : "company_account_no_subaccount",
        collection_mode: storeForSplit
          ? "store_subaccount"
          : "company_account_no_subaccount",
        paystack_account_target: storeForSplit
          ? resolvedStoreSubaccount?.paystackAccount || "old"
          : this.paystackAccountConfigService.getDefaultAccountType(),
      },
      channels: ["card", "bank", "ussd", "mobile_money"],
    };
    const response = storeForSplit
      ? {
          status: true,
          data: await this.initializeSplitTransaction({
            email: user.email,
            amount: preparedCheckout.amount_kobo,
            callback_url:
              initData.callback_url ||
              `${process.env.FRONTEND_URL}/payment/callback`,
            reference,
            store_id: storeForSplit.id,
            metadata: {
              ...payload.metadata,
              split_payment_applied: true,
              split_payment_mode: "single_store_checkout",
              collection_mode: "store_subaccount",
              paystack_account_target:
                resolvedStoreSubaccount?.paystackAccount || "old",
            },
          }),
        }
      : await firstValueFrom(
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
    const resolvedSubaccount = resolveStoreSubaccountSelection(store);

    if (!store || !resolvedSubaccount) {
      throw new BadRequestException(
        "Store subaccount is not configured for split payments",
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
        : Math.round(amountInKobo * 0.065);

    const splitPayload = {
      email: initData.email,
      amount: amountInKobo,
      currency: "NGN",
      subaccount: resolvedSubaccount.code,
      transaction_charge: adminAmount,
      bearer: "account",
      reference: initData.reference || this.generateReference(),
      callback_url: initData.callback_url,
      channels: ["card", "bank", "ussd", "mobile_money"],
      metadata: {
        ...initData.metadata,
        order_id: initData.order_id,
        store_id: initData.store_id,
      },
    };

    try {
      const response = await lastValueFrom(
        this.httpService
          .post(`${this.baseUrl}/transaction/initialize`, splitPayload, {
            headers: this.getHeaders(resolvedSubaccount.paystackAccount),
          })
          .pipe(map((r) => r.data)),
      );
      return response.data;
    } catch (err: any) {
      const paystackMsg: string =
        err?.response?.data?.message || err?.message || "";
      const isSubaccountError =
        /subaccount/i.test(paystackMsg) ||
        err?.response?.status === 400;

      if (!isSubaccountError) {
        throw new HttpException(
          paystackMsg || "Split initialization failed",
          err?.response?.status || HttpStatus.BAD_REQUEST,
        );
      }

      // Subaccount is invalid/deactivated — fall back to company account
      this.logger.warn(
        `Subaccount ${resolvedSubaccount.code} rejected by Paystack ("${paystackMsg}") — falling back to company account for store ${initData.store_id}`,
      );

      const fallbackPayload = {
        email: initData.email,
        amount: amountInKobo,
        currency: "NGN",
        reference: splitPayload.reference,
        callback_url: initData.callback_url,
        channels: ["card", "bank", "ussd", "mobile_money"],
        metadata: {
          ...initData.metadata,
          order_id: initData.order_id,
          store_id: initData.store_id,
          split_fallback: true,
          split_fallback_reason: paystackMsg,
        },
      };

      const fallbackResponse = await lastValueFrom(
        this.httpService
          .post(`${this.baseUrl}/transaction/initialize`, fallbackPayload, {
            headers: this.getHeaders(),
          })
          .pipe(
            map((r) => r.data),
            catchError((fallbackErr) => {
              throw new HttpException(
                fallbackErr?.response?.data?.message || "Payment initialization failed",
                fallbackErr?.response?.status || HttpStatus.BAD_REQUEST,
              );
            }),
          ),
      );

      return fallbackResponse.data;
    }
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
    return await this.fetchTransactionByReference(verifyData.reference, true);
  }

  /* ----------------------------------
     WEBHOOK SIGNATURE
  ---------------------------------- */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secretKeys = this.paystackAccountConfigService.getWebhookSecretKeys();

    return secretKeys.some((secretKey) => {
      const hash = crypto
        .createHmac("sha512", secretKey)
        .update(payload)
        .digest("hex");

      return hash === signature;
    });
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
      `Processed Paystack webhook event "${webhookData.event}" for ${
        webhookData.data?.reference ?? "unknown-reference"
      }`,
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
    const response = await this.fetchTransactionByReference(reference, true);

    return new DataResponseDto(response, true, "Transaction details retrieved");
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

  async reconcileTransactions(
    options: ReconcilePaystackTransactionsDto,
  ): Promise<DataResponseDto> {
    const dryRun = options.dryRun ?? true;
    const startPage = options.page || 1;
    const perPage = options.perPage || 50;
    const maxPages = options.maxPages || 1;
    const normalizedStatus = options.status?.trim().toLowerCase() || "success";
    const requestedAccount = options.account || "default";
    const results: any[] = [];

    if (options.reference) {
      const referenceAccounts: PaystackAccountType[] =
        requestedAccount === "all"
          ? ["default", "old", "new"]
          : [requestedAccount as PaystackAccountType];
      const transactionResponse = await this.fetchTransactionByReferenceAcrossAccounts(
        options.reference,
        referenceAccounts,
      );
      if (!transactionResponse?.data) {
        throw new BadRequestException(
          `Paystack transaction "${options.reference}" was not found.`,
        );
      }

      results.push(
        await this.reconcileSingleTransaction(transactionResponse.data, dryRun),
      );
    } else {
      const accountsToScan: PaystackAccountType[] =
        requestedAccount === "all"
          ? ["default", "old", "new"]
          : [requestedAccount as PaystackAccountType];
      const seenReferences = new Set<string>();

      for (const account of [...new Set(accountsToScan)]) {
        let currentPage = startPage;
        let pagesProcessed = 0;

        while (pagesProcessed < maxPages) {
          const response = await this.fetchTransactionsPage({
            account,
            page: currentPage,
            perPage,
            status: normalizedStatus,
            from: options.from,
            to: options.to,
          });
          const transactions = Array.isArray(response?.data) ? response.data : [];

          if (transactions.length === 0) {
            break;
          }

          for (const transaction of transactions) {
            const reference = transaction?.reference;
            if (reference && seenReferences.has(reference)) {
              continue;
            }

            if (reference) {
              seenReferences.add(reference);
            }

            results.push(
              await this.reconcileSingleTransaction(transaction, dryRun),
            );
          }

          pagesProcessed += 1;

          const pageCount = Number(response?.meta?.pageCount || 0);
          if (!pageCount || currentPage >= pageCount) {
            break;
          }

          currentPage += 1;
        }
      }
    }

    const summary = results.reduce(
      (acc, result: any) => {
        acc.total += 1;

        if (result.local.existsLocally) {
          acc.alreadyLinked += 1;
        } else {
          acc.missingLocally += 1;
        }

        switch (result.action) {
          case "reconciled":
            acc.reconciled += 1;
            break;
          case "skipped":
            acc.skipped += 1;
            break;
          case "failed":
            acc.failed += 1;
            break;
          default:
            break;
        }

        return acc;
      },
      {
        total: 0,
        alreadyLinked: 0,
        missingLocally: 0,
        reconciled: 0,
        skipped: 0,
        failed: 0,
      },
    );

    return new DataResponseDto(
      {
        dryRun,
        filters: {
          reference: options.reference || null,
          account: requestedAccount,
          status: normalizedStatus,
          from: options.from || null,
          to: options.to || null,
          page: startPage,
          perPage,
          maxPages,
        },
        summary,
        results,
      },
      true,
      dryRun
        ? "Paystack reconciliation preview generated successfully"
        : "Paystack reconciliation completed successfully",
    );
  }

  async diagnoseTransaction(reference: string): Promise<DataResponseDto> {
    const transactionResponse = await this.fetchTransactionByReference(
      reference,
      true,
    );

    if (!transactionResponse?.data) {
      throw new BadRequestException(
        `Paystack transaction "${reference}" was not found.`,
      );
    }

    const transactionData = transactionResponse.data;
    const localState = await this.getLocalTransactionState(
      reference,
      transactionData,
    );
    const metadata = transactionData?.metadata || {};
    const metadataOrderId = Number(metadata?.order_id);
    const metadataGuestPayload =
      this.extractGuestOrderPayloadFromTransactionMetadata(transactionData);
    const metadataGuestInfo =
      metadata?.guest_info ||
      this.buildGuestInfoFromMetadata(metadata, transactionData);
    const metadataDeliveryAddress =
      metadata?.delivery_address ||
      metadata?.address ||
      metadata?.shipping_address ||
      null;
    const metadataDeliveryToken =
      metadata?.delivery?.delivery_token ||
      metadata?.delivery_token ||
      metadata?.deliveryToken ||
      null;
    const metadataCartItems = Array.isArray(metadata?.cart_items)
      ? metadata.cart_items
      : Array.isArray(metadata?.items)
      ? metadata.items
      : [];

    const metadataOrderWhere =
      Number.isFinite(metadataOrderId) && metadataOrderId > 0
        ? {
            [Op.or]: [{ id: metadataOrderId }, { order_id: metadataOrderId }],
          }
        : null;

    const [
      guestCheckout,
      userCheckout,
      orderLog,
      paymentLog,
      ordersByReference,
      ordersByMetadata,
      payments,
    ] = await Promise.all([
      this.guestCheckoutRepository.findOne({ where: { reference } }),
      this.userCheckoutRepository.findOne({ where: { reference } }),
      this.findOrderLogByReference(reference),
      this.paymentLogRepository.findOne({ where: { ref: reference } }),
      Order.findAll({
        where: {
          [Op.or]: [
            { payment_reference: reference },
            { transaction_reference: reference },
          ],
        },
      }),
      metadataOrderWhere ? Order.findAll({ where: metadataOrderWhere }) : [],
      OrderPayments.findAll({ where: { ref: reference } }),
    ]);

    const orders = new Map<number, Order>();
    for (const order of [...ordersByReference, ...ordersByMetadata]) {
      if (order?.id) {
        orders.set(order.id, order);
      }
    }

    const guestCheckoutOrderIds = this.normalizeOrderIds(
      guestCheckout?.order_ids,
    );
    const userCheckoutOrderIds = this.normalizeOrderIds(
      userCheckout?.order_ids,
    );
    const paymentOrderIds = payments
      .map((payment) => Number(payment?.orderId))
      .filter((id) => Number.isFinite(id));
    const foundOrderIds = [...orders.keys()];

    const recovery = {
      viaExistingOrdersOrPayments:
        foundOrderIds.length > 0 || paymentOrderIds.length > 0,
      viaGuestCheckoutPayload: Boolean(guestCheckout?.payload),
      viaUserCheckoutPayload: Boolean(
        userCheckout?.payload?.order_payload &&
          userCheckout?.payload?.verified_delivery,
      ),
      viaOrderLog: Boolean(
        orderLog &&
          this.resolveVerifiedChargesPayload(orderLog?.charges)?.data
            ?.addressId,
      ),
      viaPaymentLog: Boolean(
        paymentLog &&
          this.resolveVerifiedChargesPayload(paymentLog?.charges)?.data
            ?.addressId,
      ),
      viaPaystackMetadataGuestPayload: Boolean(metadataGuestPayload),
    };

    const missingPieces: string[] = [];
    if (!guestCheckout) missingPieces.push("guest_checkout");
    if (!userCheckout) missingPieces.push("user_checkout");
    if (!orderLog) missingPieces.push("order_log");
    if (!paymentLog) missingPieces.push("payment_log");
    if (foundOrderIds.length === 0) missingPieces.push("orders");
    if (paymentOrderIds.length === 0) missingPieces.push("order_payments");

    if (!metadataGuestPayload) {
      if (!metadataGuestInfo)
        missingPieces.push("paystack_metadata.guest_info");
      if (!metadataDeliveryAddress) {
        missingPieces.push("paystack_metadata.delivery_address");
      }
      if (!metadataDeliveryToken) {
        missingPieces.push("paystack_metadata.delivery_token");
      }
      if (metadataCartItems.length === 0) {
        missingPieces.push("paystack_metadata.cart_items");
      }
    }

    const overallRecoverable = Object.values(recovery).some(Boolean);

    return new DataResponseDto(
      {
        reference,
        paystack: {
          status: transactionData?.status || null,
          amount_kobo: Number(transactionData?.amount || 0),
          currency: transactionData?.currency || "NGN",
          customer_email:
            transactionData?.customer?.email ||
            transactionData?.authorization?.email ||
            null,
          paid_at:
            transactionData?.paid_at ||
            transactionData?.created_at ||
            transactionData?.transaction_date ||
            null,
        },
        local: localState,
        sources: {
          guestCheckout: {
            found: Boolean(guestCheckout),
            status: guestCheckout?.status || null,
            payment_status: guestCheckout?.payment_status || null,
            hasPayload: Boolean(guestCheckout?.payload),
            orderIds: guestCheckoutOrderIds,
          },
          userCheckout: {
            found: Boolean(userCheckout),
            status: userCheckout?.status || null,
            payment_status: userCheckout?.payment_status || null,
            hasOrderPayload: Boolean(userCheckout?.payload?.order_payload),
            hasVerifiedDelivery: Boolean(
              userCheckout?.payload?.verified_delivery,
            ),
            orderIds: userCheckoutOrderIds,
          },
          orderLog: {
            found: Boolean(orderLog),
            hasReusableDeliveryPayload: Boolean(
              this.resolveVerifiedChargesPayload(orderLog?.charges)?.data
                ?.addressId,
            ),
            createdAt: orderLog?.createdAt || null,
          },
          paymentLog: {
            found: Boolean(paymentLog),
            hasReusableDeliveryPayload: Boolean(
              this.resolveVerifiedChargesPayload(paymentLog?.charges)?.data
                ?.addressId,
            ),
          },
          orders: {
            count: foundOrderIds.length,
            ids: foundOrderIds,
          },
          orderPayments: {
            count: payments.length,
            orderIds: paymentOrderIds,
          },
          paystackMetadata: {
            orderId:
              Number.isFinite(metadataOrderId) && metadataOrderId > 0
                ? metadataOrderId
                : null,
            hasGuestOrderPayload: Boolean(metadataGuestPayload),
            hasGuestInfo: Boolean(metadataGuestInfo),
            hasDeliveryAddress: Boolean(metadataDeliveryAddress),
            hasDeliveryToken: Boolean(metadataDeliveryToken),
            cartItemCount: metadataCartItems.length,
          },
          recovery: {
            ...recovery,
            overallRecoverable,
          },
        },
        guidance: {
          recoverable: overallRecoverable,
          summary: overallRecoverable
            ? "At least one recovery path is available for this reference."
            : "No recovery path is currently available for this reference.",
          missingPieces,
        },
      },
      true,
      "Paystack transaction diagnosis generated successfully",
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

  private async fetchTransactionByReference(
    reference: string,
    tryAllAccounts = false,
  ): Promise<any> {
    const accountsToTry: PaystackAccountType[] = tryAllAccounts
      ? ["default", "old", "new"]
      : ["default"];
    return this.fetchTransactionByReferenceAcrossAccounts(
      reference,
      accountsToTry,
    );
  }

  private async fetchTransactionByReferenceAcrossAccounts(
    reference: string,
    accountsToTry: PaystackAccountType[],
  ): Promise<any> {
    let lastError: any = null;

    for (const account of [...new Set(accountsToTry)]) {
      try {
        return await lastValueFrom(
          this.httpService
            .get(`${this.baseUrl}/transaction/verify/${reference}`, {
              headers: this.getHeaders(account),
            })
            .pipe(map((r) => r.data)),
        );
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  private async fetchTransactionsPage(params: {
    account?: PaystackAccountType;
    page: number;
    perPage: number;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<any> {
    const response = await lastValueFrom(
      this.httpService
        .get(`${this.baseUrl}/transaction`, {
          headers: this.getHeaders(params.account || "default"),
          params: {
            page: params.page,
            perPage: params.perPage,
            status: params.status,
            from: params.from,
            to: params.to,
          },
        })
        .pipe(map((r) => r.data)),
    );

    return response;
  }

  private async reconcileSingleTransaction(
    transactionData: any,
    dryRun: boolean,
  ): Promise<any> {
    const reference = transactionData?.reference;

    if (!reference) {
      return {
        reference: null,
        paystack_status: transactionData?.status || null,
        action: "skipped",
        reason: "Transaction has no Paystack reference",
        local: {
          existsLocally: false,
          orderLogFound: false,
          paymentLogFound: false,
          orderCount: 0,
          paymentCount: 0,
          orderIds: [],
          guestCheckoutStatus: null,
          userCheckoutStatus: null,
        },
      };
    }

    const localState = await this.getLocalTransactionState(
      reference,
      transactionData,
    );
    const paymentStatus = this.mapPaystackStatusToWebhookStatus(
      transactionData?.status,
    );

    const result = {
      reference,
      paystack_status: transactionData?.status || null,
      amount_kobo: Number(transactionData?.amount || 0),
      currency: transactionData?.currency || "NGN",
      customer_email:
        transactionData?.customer?.email ||
        transactionData?.authorization?.email,
      paid_at:
        transactionData?.paid_at ||
        transactionData?.created_at ||
        transactionData?.transaction_date ||
        null,
      local: localState,
      action: dryRun
        ? localState.existsLocally
          ? "already_present"
          : "missing"
        : "skipped",
      reason: null,
    };

    if (dryRun) {
      return result;
    }

    if (!paymentStatus) {
      return {
        ...result,
        action: "skipped",
        reason: `Unsupported Paystack status "${transactionData?.status}"`,
      };
    }

    if (!localState.reconcilable) {
      return {
        ...result,
        action: "skipped",
        reason:
          "No local checkout, order, or payment context was found for this reference",
      };
    }

    try {
      if (paymentStatus === "success") {
        await this.recoverGuestOrderFromTransactionMetadata(
          transactionData,
          localState,
        );
        await this.recoverAuthenticatedOrderFromOrderLog(reference, localState);
        await this.recoverAuthenticatedOrderFromPaymentLog(
          reference,
          localState,
        );
      }

      await this.handlePaymentWebhookEvent(transactionData, paymentStatus);

      return {
        ...result,
        action: "reconciled",
        reason: localState.existsLocally
          ? "Existing local records were reprocessed"
          : "Missing local records were reconciled",
      };
    } catch (error) {
      return {
        ...result,
        action: "failed",
        reason: (error as any)?.message || "Reconciliation failed",
      };
    }
  }

  private async getLocalTransactionState(
    reference: string,
    transactionData?: any,
  ): Promise<{
    existsLocally: boolean;
    reconcilable: boolean;
    orderCount: number;
    paymentCount: number;
    orderIds: number[];
    guestCheckoutStatus: string | null;
    userCheckoutStatus: string | null;
    orderLogFound: boolean;
    paymentLogFound: boolean;
  }> {
    const metadataOrderId = Number(transactionData?.metadata?.order_id);
    const metadataOrderWhere =
      Number.isFinite(metadataOrderId) && metadataOrderId > 0
        ? {
            [Op.or]: [{ id: metadataOrderId }, { order_id: metadataOrderId }],
          }
        : null;

    const [
      guestCheckout,
      userCheckout,
      orderLog,
      paymentLog,
      ordersByReference,
      ordersByMetadata,
      payments,
    ] = await Promise.all([
      this.guestCheckoutRepository.findOne({ where: { reference } }),
      this.userCheckoutRepository.findOne({ where: { reference } }),
      this.findOrderLogByReference(reference),
      this.paymentLogRepository.findOne({ where: { ref: reference } }),
      Order.findAll({
        where: {
          [Op.or]: [
            { payment_reference: reference },
            { transaction_reference: reference },
          ],
        },
      }),
      metadataOrderWhere ? Order.findAll({ where: metadataOrderWhere }) : [],
      OrderPayments.findAll({ where: { ref: reference } }),
    ]);

    const orders = new Map<number, Order>();
    for (const order of [...ordersByReference, ...ordersByMetadata]) {
      if (order?.id) {
        orders.set(order.id, order);
      }
    }

    const paymentOrderIds = payments
      .map((payment) => Number(payment?.orderId))
      .filter((id) => Number.isFinite(id));
    const checkoutOrderIds = [
      ...this.normalizeOrderIds(guestCheckout?.order_ids),
      ...this.normalizeOrderIds(userCheckout?.order_ids),
    ];
    const orderIds = [
      ...new Set([...orders.keys(), ...paymentOrderIds, ...checkoutOrderIds]),
    ];

    const existsLocally =
      orderIds.length > 0 ||
      payments.length > 0 ||
      !!guestCheckout ||
      !!userCheckout ||
      !!orderLog ||
      !!paymentLog;
    const guestMetadataPayload =
      this.extractGuestOrderPayloadFromTransactionMetadata(transactionData);
    const reconcilable =
      orderIds.length > 0 ||
      payments.length > 0 ||
      Boolean(guestCheckout?.payload) ||
      Boolean(userCheckout?.payload) ||
      Boolean(orderLog) ||
      Boolean(paymentLog) ||
      Boolean(guestMetadataPayload);

    return {
      existsLocally,
      reconcilable,
      orderCount: orders.size,
      paymentCount: payments.length,
      orderIds,
      guestCheckoutStatus: guestCheckout?.status || null,
      userCheckoutStatus: userCheckout?.status || null,
      orderLogFound: Boolean(orderLog),
      paymentLogFound: Boolean(paymentLog),
    };
  }

  private async findOrderLogByReference(
    reference: string,
  ): Promise<OrderLog | null> {
    if (!reference) {
      return null;
    }

    try {
      return await OrderLog.findOne({
        attributes: [
          "id",
          "userId",
          "address",
          "cart",
          "payment",
          "charges",
          "createdAt",
          "updatedAt",
        ],
        where: {
          payment: {
            [Op.contains]: { ref: reference },
          } as any,
        },
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      this.logger.warn(
        `Skipping ORDER_LOG lookup for ${reference}: ${
          (error as any)?.message || "query failed"
        }`,
      );
      return null;
    }
  }

  private async recoverAuthenticatedOrderFromOrderLog(
    reference: string,
    localState: {
      orderIds: number[];
      paymentCount: number;
      userCheckoutStatus: string | null;
      orderLogFound: boolean;
    },
  ): Promise<void> {
    if (
      localState.orderIds.length > 0 ||
      localState.paymentCount > 0 ||
      localState.userCheckoutStatus ||
      !localState.orderLogFound
    ) {
      return;
    }

    const orderLog = await this.findOrderLogByReference(reference);
    if (!orderLog) {
      return;
    }

    const verifiedChargesData = this.resolveVerifiedChargesPayload(
      orderLog?.charges,
    );

    if (!verifiedChargesData?.data?.addressId) {
      throw new BadRequestException(
        "Stored order log does not contain a reusable delivery payload.",
      );
    }

    const payload = this.buildAuthenticatedOrderPayloadFromOrderLog(
      orderLog,
      reference,
    );

    await this.orderPlaceService.create(Number(orderLog.userId), payload, {
      skipDeliveryTokenVerification: true,
      verifiedChargesData,
    });
  }

  private async recoverAuthenticatedOrderFromPaymentLog(
    reference: string,
    localState: {
      orderIds: number[];
      paymentCount: number;
      userCheckoutStatus: string | null;
      orderLogFound: boolean;
      paymentLogFound: boolean;
    },
  ): Promise<void> {
    if (
      localState.orderIds.length > 0 ||
      localState.paymentCount > 0 ||
      localState.userCheckoutStatus ||
      localState.orderLogFound ||
      !localState.paymentLogFound
    ) {
      return;
    }

    const paymentLog = await this.paymentLogRepository.findOne({
      where: { ref: reference },
    });

    if (!paymentLog) {
      return;
    }

    const verifiedChargesData = this.resolveVerifiedChargesPayload(
      paymentLog?.charges,
    );

    if (!verifiedChargesData?.data?.addressId) {
      throw new BadRequestException(
        "Stored payment log does not contain a reusable delivery payload.",
      );
    }

    const payload = this.buildAuthenticatedOrderPayloadFromPaymentLog(
      paymentLog,
      reference,
    );

    await this.orderPlaceService.create(Number(paymentLog.userId), payload, {
      skipDeliveryTokenVerification: true,
      verifiedChargesData,
    });
  }

  private buildAuthenticatedOrderPayloadFromPaymentLog(
    paymentLog: PaymentLog,
    reference: string,
  ): CreateOrderDto {
    const cart = Array.isArray(paymentLog?.cart)
      ? paymentLog.cart.map((item: any) => ({
          id: item?.id,
          productId: Number(item?.productId ?? item?.product_id),
          variantId:
            item?.variantId != null || item?.variant_id != null
              ? Number(item?.variantId ?? item?.variant_id)
              : null,
          storeId: Number(item?.storeId ?? item?.store_id),
          quantity: Number(item?.quantity),
        }))
      : [];

    return {
      cart: cart as any,
      address: {
        id: Number(paymentLog.addressId),
      },
      charges: {
        token: String(
          (paymentLog?.charges as any)?.token || "recovered-payment-log",
        ),
      },
      payment: {
        ref: reference,
        type: PaymentTypeEnum.Paystack,
      },
    };
  }

  private buildAuthenticatedOrderPayloadFromOrderLog(
    orderLog: OrderLog,
    reference: string,
  ): CreateOrderDto {
    const payment = (orderLog?.payment || {}) as any;

    return {
      cart: Array.isArray(orderLog?.cart) ? (orderLog.cart as any[]) : [],
      address: (orderLog?.address || {}) as any,
      charges: {
        token: String(
          (orderLog?.charges as any)?.token || "recovered-order-log",
        ),
      },
      payment: {
        ...payment,
        ref: reference,
        type: payment?.type || PaymentTypeEnum.Paystack,
      },
    };
  }

  private resolveVerifiedChargesPayload(charges: any): any {
    if (charges?.data?.addressId != null) {
      return charges;
    }

    if (typeof charges?.token === "string" && charges.token.trim()) {
      const decoded = this.jwtService.decode(charges.token);
      if (decoded && typeof decoded === "object") {
        return decoded;
      }
    }

    return null;
  }

  private async recoverGuestOrderFromTransactionMetadata(
    transactionData: any,
    localState: {
      orderIds: number[];
      paymentCount: number;
      guestCheckoutStatus: string | null;
    },
  ): Promise<void> {
    if (
      localState.orderIds.length > 0 ||
      localState.paymentCount > 0 ||
      localState.guestCheckoutStatus
    ) {
      return;
    }

    const payload =
      this.extractGuestOrderPayloadFromTransactionMetadata(transactionData);

    if (!payload) {
      return;
    }

    await this.guestOrderService.createGuestOrder(payload, {
      skipPaymentVerification: true,
      verifiedPaymentData: transactionData,
      skipDeliveryTokenVerification: true,
      verifiedDeliveryData: this.buildGuestVerifiedDeliveryData(payload),
    });
  }

  private extractGuestOrderPayloadFromTransactionMetadata(
    transactionData: any,
  ): CreateGuestOrderDto | null {
    const metadata = transactionData?.metadata || {};

    for (const candidate of [
      metadata?.order_payload,
      metadata?.guest_order_payload,
      metadata?.checkout_payload,
    ]) {
      if (this.looksLikeGuestOrderPayload(candidate)) {
        return this.buildGuestOrderPayload(
          candidate,
          transactionData?.reference,
        );
      }
    }

    const guestInfo =
      metadata?.guest_info ||
      this.buildGuestInfoFromMetadata(metadata, transactionData);
    const deliveryAddress =
      metadata?.delivery_address ||
      metadata?.address ||
      metadata?.shipping_address;
    const deliveryToken =
      metadata?.delivery?.delivery_token ||
      metadata?.delivery_token ||
      metadata?.deliveryToken;
    const cartItems = Array.isArray(metadata?.cart_items)
      ? metadata.cart_items
      : Array.isArray(metadata?.items)
      ? metadata.items
      : null;

    if (
      !guestInfo ||
      !deliveryAddress ||
      !deliveryToken ||
      !Array.isArray(cartItems) ||
      cartItems.length === 0
    ) {
      return null;
    }

    return {
      guest_info: guestInfo,
      delivery_address: deliveryAddress,
      cart_items: cartItems,
      delivery: {
        ...(metadata?.delivery || {}),
        delivery_token: deliveryToken,
        delivery_charge:
          metadata?.delivery?.delivery_charge ?? metadata?.delivery_charge,
      },
      order_summary:
        metadata?.order_summary ||
        (metadata?.delivery_charge != null
          ? {
              delivery_fee: Number(metadata.delivery_charge),
              total: Number(transactionData?.amount || 0) / 100,
            }
          : undefined),
      payment: {
        payment_reference: transactionData?.reference,
        transaction_reference: transactionData?.reference,
        payment_status: "success",
        amount_paid: Number(transactionData?.amount || 0) / 100,
        paid_at:
          transactionData?.paid_at ||
          transactionData?.created_at ||
          transactionData?.transaction_date ||
          undefined,
      },
      metadata: metadata?.metadata || {},
    } as CreateGuestOrderDto;
  }

  private looksLikeGuestOrderPayload(
    payload: any,
  ): payload is CreateGuestOrderDto {
    return Boolean(
      payload?.guest_info?.email &&
        payload?.delivery_address?.full_address &&
        payload?.delivery?.delivery_token &&
        Array.isArray(payload?.cart_items) &&
        payload.cart_items.length > 0,
    );
  }

  private buildGuestInfoFromMetadata(metadata: any, transactionData: any) {
    const customFields = Array.isArray(metadata?.custom_fields)
      ? metadata.custom_fields
      : [];
    const guestNameField = customFields.find(
      (field: any) => field?.variable_name === "guest_name",
    );
    const guestPhoneField = customFields.find(
      (field: any) => field?.variable_name === "guest_phone",
    );

    const guestEmail =
      metadata?.guest_email ||
      transactionData?.customer?.email ||
      transactionData?.authorization?.email;
    const fullName = String(guestNameField?.value || "").trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = metadata?.guest_info?.first_name || nameParts[0];
    const lastName =
      metadata?.guest_info?.last_name ||
      (nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName);
    const phone = metadata?.guest_info?.phone || guestPhoneField?.value;

    if (!guestEmail || !firstName || !lastName || !phone) {
      return null;
    }

    return {
      email: String(guestEmail).toLowerCase().trim(),
      first_name: String(firstName).trim(),
      last_name: String(lastName).trim(),
      phone: String(phone).trim(),
      country_code: metadata?.guest_info?.country_code,
    };
  }

  private mapPaystackStatusToWebhookStatus(
    paystackStatus: string,
  ): "success" | "failed" | null {
    const normalizedStatus = String(paystackStatus || "").toLowerCase();

    if (normalizedStatus === "success") {
      return "success";
    }

    if (["failed", "abandoned", "reversed"].includes(normalizedStatus)) {
      return "failed";
    }

    return null;
  }

  private async handlePaymentWebhookEvent(
    paymentData: any,
    paymentStatus: "success" | "failed",
  ): Promise<void> {
    const reference = paymentData?.reference;

    if (!reference) {
      this.logger.warn(
        "Received Paystack webhook without a transaction reference",
      );
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

    await OrderPayments.sequelize!.transaction(async (t: Transaction) => {
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
    const settlementMetadata = await this.buildSettlementAuditMetadata(
      order,
      paymentData,
      transaction,
    );
    const existingPayment = await OrderPayments.findOne({
      where: { orderId: order.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (existingPayment) {
      const updatePayload: Record<string, any> = {
        collection_mode: settlementMetadata.collection_mode,
        paystack_account_used: settlementMetadata.paystack_account_used,
        requires_manual_settlement:
          settlementMetadata.requires_manual_settlement,
        manual_settlement_reason:
          settlementMetadata.manual_settlement_reason,
      };

      if (existingPayment.ref !== reference) {
        updatePayload.ref = reference;
      }

      await existingPayment.update(updatePayload, { transaction });
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
        cardHolder: paymentData.customer?.email || order.guest_email || null,
        collection_mode: settlementMetadata.collection_mode,
        paystack_account_used: settlementMetadata.paystack_account_used,
        requires_manual_settlement:
          settlementMetadata.requires_manual_settlement,
        manual_settlement_reason:
          settlementMetadata.manual_settlement_reason,
      } as any,
      { transaction },
    );
  }

  private async buildSettlementAuditMetadata(
    order: Order,
    paymentData: any,
    transaction: Transaction,
  ): Promise<{
    collection_mode: string;
    paystack_account_used: string;
    requires_manual_settlement: boolean;
    manual_settlement_reason: string | null;
  }> {
    const metadata = paymentData?.metadata || {};
    const store = await this.storeRepository.findByPk(order.storeId, {
      transaction,
    });
    const resolvedSubaccount = resolveStoreSubaccountSelection(store);
    const hasUsableStoreSubaccount = Boolean(
      store && store.subaccount_status === "active" && resolvedSubaccount,
    );

    const collectionMode =
      metadata.collection_mode ||
      metadata.split_payment_mode ||
      (hasUsableStoreSubaccount
        ? "store_subaccount"
        : "company_account_no_subaccount");
    const paystackAccountUsed =
      metadata.paystack_account_target ||
      (collectionMode === "store_subaccount"
        ? resolvedSubaccount?.paystackAccount || "old"
        : this.paystackAccountConfigService.getDefaultAccountType());
    const requiresManualSettlement =
      collectionMode === "company_account_no_subaccount";

    return {
      collection_mode: collectionMode,
      paystack_account_used: paystackAccountUsed,
      requires_manual_settlement: requiresManualSettlement,
      manual_settlement_reason: requiresManualSettlement
        ? "Seller does not have an active Paystack subaccount, so funds were collected into the company account for manual payout."
        : null,
    };
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
      } as any,
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
          guestCheckout.status === "completed"
            ? guestCheckout.status
            : "failed",
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
      const storedPayload = guestCheckout.payload;
      const verifiedDeliveryData =
        this.buildGuestVerifiedDeliveryData(storedPayload);
      const payload = this.buildGuestOrderPayload(storedPayload, reference);
      const result = await this.guestOrderService.createGuestOrder(payload, {
        skipPaymentVerification: true,
        verifiedPaymentData: paymentData,
        skipDeliveryTokenVerification: true,
        verifiedDeliveryData,
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
        error: (error as any)?.message || "Guest checkout finalization failed",
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
        error:
          (error as any)?.message ||
          "Authenticated checkout finalization failed",
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

  private buildGuestVerifiedDeliveryData(payload: any): {
    data: {
      amount: number;
      status: boolean;
      addressId: string | number | null;
      discount: number;
      tax: number;
      totalWeight: number;
      isGuest: boolean;
    };
  } {
    const deliveryCharge = Number(
      payload?.delivery?.delivery_charge ??
        payload?.order_summary?.delivery_fee,
    );
    const discount = Number(payload?.order_summary?.discount);
    const tax = Number(payload?.order_summary?.tax);
    const totalWeight = Number(payload?.delivery?.total_weight);

    return {
      data: {
        amount: Number.isFinite(deliveryCharge) ? deliveryCharge : 0,
        status: true,
        addressId: payload?.delivery_address?.id ?? null,
        discount: Number.isFinite(discount) ? discount : 0,
        tax: Number.isFinite(tax) ? tax : 0,
        totalWeight:
          Number.isFinite(totalWeight) && totalWeight > 0 ? totalWeight : 1,
        isGuest: true,
      },
    };
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
    } as any);
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
    } as any);
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
      this.assertSingleStoreSplitOnly(storeIds);
      const storeForSplit = await this.getEligibleSingleStoreForSplit(storeIds);
      const resolvedStoreSubaccount = storeForSplit
        ? resolveStoreSubaccountSelection(storeForSplit)
        : null;

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
        guest_email: guestData.guest_info.email.toLowerCase().trim(),
        guest_info: guestData.guest_info,
        cart_items: guestData.cart_items,
        delivery_charge: guestData.delivery_charge,
        store_ids: storeIds,
        is_multi_seller: isMultiSeller,
        delivery_address: guestData.order_payload?.delivery_address,
        delivery: guestData.order_payload?.delivery,
        order_summary: guestData.order_payload?.order_summary,
        guest_order_payload: guestData.order_payload
          ? this.buildGuestOrderPayload(guestData.order_payload, reference)
          : undefined,
        split_payment_applied: Boolean(storeForSplit),
        split_payment_mode: storeForSplit
          ? "single_store_guest_checkout"
          : isMultiSeller
          ? "not_supported_multi_store_checkout"
          : "company_account_no_subaccount",
        collection_mode: storeForSplit
          ? "store_subaccount"
          : "company_account_no_subaccount",
        paystack_account_target: storeForSplit
          ? resolvedStoreSubaccount?.paystackAccount || "old"
          : this.paystackAccountConfigService.getDefaultAccountType(),
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

      const response = storeForSplit
        ? {
            status: true,
            data: await this.initializeSplitTransaction({
              email: guestData.guest_info.email,
              amount: totalAmount,
              callback_url:
                guestData.callback_url ||
                `${process.env.FRONTEND_URL}/guest/payment/callback`,
              reference,
              store_id: storeForSplit.id,
              metadata,
            }),
          }
        : await firstValueFrom(
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
        `Guest payment initialization failed: ${(error as any).message}`,
      );

      // ✅ Better error handling
      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException(
        (error as any).response?.data?.message ||
          (error as any).message ||
          "Failed to initialize payment",
      );
    }
  }

  // GUEST USER DATA ENDS HERE

  private async shouldAutoSplitExistingOrder(
    orderId?: number,
  ): Promise<boolean> {
    if (!orderId) {
      return false;
    }

    const order = await Order.findByPk(orderId);
    if (!order?.storeId) {
      return false;
    }

    const store = await this.storeRepository.findByPk(order.storeId);
    return this.canUseAutomaticSplit(store);
  }

  private async getEligibleSingleStoreForSplit(
    storeIds?: number[],
  ): Promise<Store | null> {
    const uniqueStoreIds = [...new Set((storeIds || []).map(Number))].filter(
      (storeId) => Number.isFinite(storeId) && storeId > 0,
    );

    if (uniqueStoreIds.length !== 1) {
      return null;
    }

    const store = await this.storeRepository.findByPk(uniqueStoreIds[0]);
    return this.canUseAutomaticSplit(store) ? store : null;
  }

  private canUseAutomaticSplit(store?: Store | null): boolean {
    return Boolean(
      store &&
        store.subaccount_status === "active" &&
        resolveStoreSubaccountSelection(store),
    );
  }

  private assertSingleStoreSplitOnly(storeIds?: number[]): void {
    const uniqueStoreIds = [...new Set((storeIds || []).map(Number))].filter(
      (storeId) => Number.isFinite(storeId) && storeId > 0,
    );

    if (uniqueStoreIds.length > 1) {
      throw new BadRequestException(
        "Multi-store checkout is temporarily unavailable because automatic seller split settlement is only supported for single-store payments.",
      );
    }
  }
}
