import {
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { catchError, lastValueFrom, map } from "rxjs";
import * as crypto from "crypto";
import { Sequelize, Transaction } from "sequelize";

import { DataResponseDto } from "../shared/dto/data-response-dto";
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
import { OrderPayments } from "src/ORDER_PAYMENTS/order_payments.entity";
import { OrderStatus } from "src/ORDER_STATUS/order_status.entity";
import { Order } from "src/ORDER/order.entity";

@Injectable()
export class PaystackService {
  private readonly baseUrl = "https://api.paystack.co";

  constructor(
    private readonly httpService: HttpService,

    @Inject("SEQUELIZE")
    private readonly sequelize: Sequelize,

    @Inject("StoreRepository")
    private readonly storeRepository: typeof Store,

    private readonly paymentSplitService: PaymentSplitService
  ) {}

  /* ----------------------------------------------------
     HEADERS
  ---------------------------------------------------- */
  private getHeaders(): { [key: string]: string } {
    return {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    };
  }

  /* ----------------------------------------------------
     INITIALIZE PAYMENT
  ---------------------------------------------------- */
  async initializePayment(
    initData: PaystackInitializeDto
  ): Promise<PaystackInitializeResponseDto> {
    const amountInKobo = Number(initData.amount);
    if (amountInKobo < 100) {
      throw new HttpException(
        "Amount must be at least 100 kobo",
        HttpStatus.BAD_REQUEST
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
              err.response?.status || HttpStatus.BAD_REQUEST
            );
          })
        )
    );

    return new DataResponseDto(response, true, "Payment initialized");
  }

  /* ----------------------------------------------------
     SPLIT PAYMENT
  ---------------------------------------------------- */
  private async initializeWithSplit(
    initData: PaystackInitializeDto
  ): Promise<PaystackInitializeResponseDto> {
    const store = await this.storeRepository.findByPk(initData.store_id);
    if (!store || !store.paystack_subaccount_code) {
      throw new HttpException("Invalid store subaccount", HttpStatus.BAD_REQUEST);
    }

    const amountInKobo = Number(initData.amount);
    const adminAmount = Math.round(amountInKobo * 0.05);

    if (initData.order_id) {
      await this.paymentSplitService.createPaymentSplit(
        initData.order_id,
        amountInKobo / 100
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
        .pipe(map((r) => r.data))
    );

    return new DataResponseDto(response, true, "Split payment initialized");
  }

  /* ----------------------------------------------------
     VERIFY PAYMENT (MANUAL)
  ---------------------------------------------------- */
  async verifyPayment(
    verifyData: PaystackVerifyDto
  ): Promise<PaystackVerificationResponseDto> {
    const response = await lastValueFrom(
      this.httpService
        .get(`${this.baseUrl}/transaction/verify/${verifyData.reference}`, {
          headers: this.getHeaders(),
        })
        .pipe(map((r) => r.data))
    );

    return new DataResponseDto(response, true, "Verification completed");
  }

  /* ----------------------------------------------------
     WEBHOOK SIGNATURE
  ---------------------------------------------------- */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(payload)
      .digest("hex");

    return hash === signature;
  }

  /* ----------------------------------------------------
     WEBHOOK ENTRY
  ---------------------------------------------------- */
  async processWebhook(
    webhookData: PaystackWebhookDto,
    signature: string,
    rawPayload: string
  ): Promise<any> {
    if (!this.verifyWebhookSignature(rawPayload, signature)) {
      throw new HttpException("Invalid webhook signature", HttpStatus.UNAUTHORIZED);
    }

    switch (webhookData.event) {
      case "charge.success":
        await this.handleSuccessfulPayment(webhookData.data);
        break;

      case "charge.failed":
        await this.handleFailedPayment(webhookData.data);
        break;
    }

    return new DataResponseDto(
      { event: webhookData.event },
      true,
      "Webhook processed"
    );
  }

  /* ----------------------------------------------------
     SUCCESS HANDLER (ATOMIC)
  ---------------------------------------------------- */
  private async handleSuccessfulPayment(paymentData: any): Promise<void> {
    await this.sequelize.transaction(async (t: Transaction) => {
      const payment = await OrderPayments.findOne({
        where: { ref: paymentData.reference },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!payment || payment.status === "success") return;

      // Amount validation
      if (paymentData.amount !== payment.amount) {
        throw new Error("Amount mismatch detected");
      }

      await payment.update(
        {
          status: "success",
          currency: paymentData.currency,
          cardHolder: paymentData.customer?.email,
        },
        { transaction: t }
      );

      await Order.update(
        { status: "paid" },
        { where: { id: payment.orderId }, transaction: t }
      );

      await OrderStatus.create(
        {
          orderId: payment.orderId,
          status: "paid",
          remark: "Payment confirmed via Paystack",
        },
        { transaction: t }
      );
    });
  }

  /* ----------------------------------------------------
     FAILED HANDLER (ATOMIC)
  ---------------------------------------------------- */
  private async handleFailedPayment(paymentData: any): Promise<void> {
    await this.sequelize.transaction(async (t: Transaction) => {
      const payment = await OrderPayments.findOne({
        where: { ref: paymentData.reference },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!payment) return;

      await payment.update({ status: "failed" }, { transaction: t });

      await Order.update(
        { status: "failed" },
        { where: { id: payment.orderId }, transaction: t }
      );

      await OrderStatus.create(
        {
          orderId: payment.orderId,
          status: "failed",
          remark: "Payment failed via Paystack",
        },
        { transaction: t }
      );
    });
  }
/**
   * Create refund for Paystack transaction
   */
  async createRefund(
    refundData: PaystackRefundDto
  ): Promise<PaystackRefundResponseDto> {
    try {
      const payload = {
        transaction: refundData.transaction,
        amount: refundData.amount,
        currency: refundData.currency || "NGN",
        customer_note: refundData.reason || "Refund requested",
        merchant_note: refundData.reason || "Refund processed",
      };

      // Remove undefined fields
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      const response = await lastValueFrom(
        this.httpService
          .post(`${this.baseUrl}/refund`, payload, {
            headers: this.getHeaders(),
          })
          .pipe(
            map((resp) => resp.data),
            catchError((error) => {
              console.error(
                "Paystack refund error:",
                error.response?.data || error.message
              );
              throw new HttpException(
                error.response?.data?.message || "Refund request failed",
                error.response?.status || HttpStatus.BAD_REQUEST
              );
            })
          )
      );

      return new DataResponseDto(
        response,
        true,
        "Refund processed successfully"
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error("Create refund error:", error);
      throw new HttpException(
        "Failed to process refund",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
    /* ----------------------------------------------------
      HELPERS
    ---------------------------------------------------- */
    private generateReference(): string {
      return `alaba_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    async verifyPaymentByReference(reference: string): Promise<any> {
    const result = await this.verifyPayment({ reference });
    return result.data;
  }

  async getTransactionDetails(reference: string): Promise<any> {
    return this.verifyPayment({ reference });
  }

  async listTransactions(page = 1, perPage = 50): Promise<any> {
    const response = await lastValueFrom(
      this.httpService.get(
        `${this.baseUrl}/transaction?page=${page}&perPage=${perPage}`,
        { headers: this.getHeaders() }
      ).pipe(map(r => r.data))
    );

    return new DataResponseDto(response.data, true);
  }

}
