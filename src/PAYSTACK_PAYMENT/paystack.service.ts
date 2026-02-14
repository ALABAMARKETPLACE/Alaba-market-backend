import {
  HttpException,
  HttpStatus,
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

// GUEST USER IMPORTS

import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { PaystackGuestInitializeDto } from "./dto/paystack-guest-initialize.dto";

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl = "https://api.paystack.co";

  constructor(
    private readonly httpService: HttpService,

    @InjectModel(Store)
    private readonly storeRepository: typeof Store,

    private readonly paymentSplitService: PaymentSplitService,
  ) {}

  /* ----------------------------------
     HEADERS
  ---------------------------------- */
  private getHeaders() {
    return {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    };
  }

  /* ----------------------------------
     INITIALIZE PAYMENT
  ---------------------------------- */
  async initializePayment(
    initData: PaystackInitializeDto,
  ): Promise<PaystackInitializeResponseDto> {
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
  ): Promise<PaystackInitializeResponseDto> {
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
  async verifyPayment(verifyData: PaystackVerifyDto): Promise<any> {
    const response = await lastValueFrom(
      this.httpService
        .get(`${this.baseUrl}/transaction/verify/${verifyData.reference}`, {
          headers: this.getHeaders(),
        })
        .pipe(map((r) => r.data)),
    );

    return response.data;
  }

  /* ----------------------------------
     WEBHOOK SIGNATURE
  ---------------------------------- */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
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
  ): Promise<void> {
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
  }

  /* ----------------------------------
     SUCCESS HANDLER
  ---------------------------------- */
  private async handleSuccessfulPayment(paymentData: any): Promise<void> {
    await OrderPayments.sequelize.transaction(async (t: Transaction) => {
      const payment = await OrderPayments.findOne({
        where: { ref: paymentData.reference },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!payment || payment.status === "success") return;

      await payment.update(
        {
          status: "success",
          currency: paymentData.currency,
          cardHolder: paymentData.customer?.email,
        },
        { transaction: t },
      );

      await Order.update(
        { status: "paid" },
        { where: { id: payment.orderId }, transaction: t },
      );

      await OrderStatus.create(
        {
          orderId: payment.orderId,
          status: "paid",
          remark: "Payment confirmed via Paystack",
        },
        { transaction: t },
      );
    });
  }

  /* ----------------------------------
     FAILED HANDLER
  ---------------------------------- */
  private async handleFailedPayment(paymentData: any): Promise<void> {
    await OrderPayments.sequelize.transaction(async (t: Transaction) => {
      const payment = await OrderPayments.findOne({
        where: { ref: paymentData.reference },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!payment) return;

      await payment.update({ status: "failed" }, { transaction: t });

      await Order.update(
        { status: "failed" },
        { where: { id: payment.orderId }, transaction: t },
      );

      await OrderStatus.create(
        {
          orderId: payment.orderId,
          status: "failed",
          remark: "Payment failed via Paystack",
        },
        { transaction: t },
      );
    });
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
      response.data,
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
        ...new Set(guestData.cart_items.map((item) => item.store_id)),
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


