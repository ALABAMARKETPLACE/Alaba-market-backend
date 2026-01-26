import {
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { HttpService } from "@nestjs/axios";
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

@Injectable()
export class PaystackService {
  private readonly baseUrl = "https://api.paystack.co";

  constructor(
    private readonly httpService: HttpService,

    @InjectModel(Store)
    private readonly storeRepository: typeof Store,

    private readonly paymentSplitService: PaymentSplitService
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

    return response.data;
  }

  /* ----------------------------------
     SPLIT PAYMENT
  ---------------------------------- */
  private async initializeWithSplit(
    initData: PaystackInitializeDto
  ): Promise<PaystackInitializeResponseDto> {
    const store = await this.storeRepository.findByPk(initData.store_id);
    if (!store || !store.paystack_subaccount_code) {
      throw new HttpException(
        "Invalid store subaccount",
        HttpStatus.BAD_REQUEST
      );
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
        .pipe(map((r) => r.data))
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
    rawPayload: string
  ): Promise<void> {
    if (!this.verifyWebhookSignature(rawPayload, signature)) {
      throw new HttpException(
        "Invalid webhook signature",
        HttpStatus.UNAUTHORIZED
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

  /* ----------------------------------
     REFUND
  ---------------------------------- */
  async createRefund(
    refundData: PaystackRefundDto
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
        .pipe(map((r) => r.data))
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
}
