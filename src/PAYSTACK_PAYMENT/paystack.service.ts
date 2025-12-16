import { HttpException, HttpStatus, Injectable, Inject } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { catchError, lastValueFrom, map } from "rxjs";
import * as crypto from "crypto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
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

@Injectable()
export class PaystackService {
  private readonly baseUrl = "https://api.paystack.co";

  constructor(
    private readonly httpService: HttpService,
    @Inject("StoreRepository")
    private readonly storeRepository: typeof Store,
    private readonly paymentSplitService: PaymentSplitService
  ) {}

  /**
   * Generate request headers for Paystack API
   */
  private getHeaders(): { [key: string]: string } {
    let key = process.env.PAYSTACK_SECRET_KEY; // Fixed typo: use SECRET_KEY for backend API calls
    return {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Initialize Paystack payment transaction
   */
  async initializePayment(
    initData: PaystackInitializeDto
  ): Promise<PaystackInitializeResponseDto> {
    try {
      // Validate amount (convert to kobo if needed)
      const amountInKobo = Number(initData.amount);
      if (amountInKobo < 100) {
        throw new HttpException(
          "Amount must be at least 100 kobo (1 NGN)",
          HttpStatus.BAD_REQUEST
        );
      }

      // Check if this is a split payment
      if (initData.split_payment && initData.store_id) {
        return await this.initializeWithSplit(initData);
      }

      // Standard payment (no split)
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

      // Remove undefined fields
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      const response = await lastValueFrom(
        this.httpService
          .post(`${this.baseUrl}/transaction/initialize`, payload, {
            headers: this.getHeaders(),
          })
          .pipe(
            map((resp) => resp.data),
            catchError((error) => {
              console.error(
                "Paystack initialization error:",
                error.response?.data || error.message
              );
              throw new HttpException(
                error.response?.data?.message ||
                  "Payment initialization failed",
                error.response?.status || HttpStatus.BAD_REQUEST
              );
            })
          )
      );

      return new DataResponseDto(
        response,
        true,
        "Payment initialized successfully"
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error("Initialize payment error:", error);
      throw new HttpException(
        "Failed to initialize payment",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Initialize payment with automatic split (5% admin, 95% seller)
   */
  private async initializeWithSplit(
    initData: PaystackInitializeDto
  ): Promise<PaystackInitializeResponseDto> {
    try {
      // Get store details and verify subaccount
      const store = await this.storeRepository.findByPk(initData.store_id);
      if (!store) {
        throw new HttpException("Store not found", HttpStatus.NOT_FOUND);
      }

      if (!store.paystack_subaccount_code || store.subaccount_status !== "active") {
        throw new HttpException(
          "Store subaccount not active. Contact support.",
          HttpStatus.BAD_REQUEST
        );
      }

      // Calculate split amounts
      const amountInKobo = Number(initData.amount);
      const adminPercentage = 5.0;
      const adminAmountInKobo = Math.round((amountInKobo * adminPercentage) / 100);
      
      // Create payment split record if order_id provided
      if (initData.order_id) {
        await this.paymentSplitService.createPaymentSplit(
          initData.order_id, 
          amountInKobo / 100 // Convert back to Naira
        );
      }

      // Prepare split payment payload
      const payload = {
        email: initData.email,
        amount: amountInKobo,
        currency: initData.currency || "NGN",
        callback_url: initData.callback_url,
        reference: initData.reference || this.generateReference(),
        subaccount: store.paystack_subaccount_code,
        transaction_charge: adminAmountInKobo, // Admin gets 5%
        bearer: "account", // Main account bears transaction fees
        metadata: {
          ...initData.metadata,
          order_id: initData.order_id,
          store_id: initData.store_id,
          store_name: store.store_name,
          split_type: "automatic",
          admin_amount_kobo: adminAmountInKobo,
          seller_amount_kobo: amountInKobo - adminAmountInKobo,
        },
      };

      // Remove undefined fields
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      const response = await lastValueFrom(
        this.httpService
          .post(`${this.baseUrl}/transaction/initialize`, payload, {
            headers: this.getHeaders(),
          })
          .pipe(
            map((resp) => resp.data),
            catchError((error) => {
              console.error(
                "Paystack split initialization error:",
                error.response?.data || error.message
              );
              throw new HttpException(
                error.response?.data?.message ||
                  "Split payment initialization failed",
                error.response?.status || HttpStatus.BAD_REQUEST
              );
            })
          )
      );

      return new DataResponseDto(
        response,
        true,
        "Split payment initialized successfully"
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error("Initialize split payment error:", error);
      throw new HttpException(
        "Failed to initialize split payment",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate unique payment reference
   */
  private generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `alaba_${timestamp}_${random}`;
  }

  /**
   * Verify Paystack payment transaction
   */
  async verifyPayment(
    verifyData: PaystackVerifyDto
  ): Promise<PaystackVerificationResponseDto> {
    try {
      const response = await lastValueFrom(
        this.httpService
          .get(`${this.baseUrl}/transaction/verify/${verifyData.reference}`, {
            headers: this.getHeaders(),
          })
          .pipe(
            map((resp) => resp.data),
            catchError((error) => {
              console.error(
                "Paystack verification error:",
                error.response?.data || error.message
              );
              throw new HttpException(
                error.response?.data?.message || "Payment verification failed",
                error.response?.status || HttpStatus.BAD_REQUEST
              );
            })
          )
      );

      return new DataResponseDto(
        response,
        true,
        "Payment verification completed"
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error("Verify payment error:", error);
      throw new HttpException(
        "Failed to verify payment",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Verify payment by reference (simple method)
   */
  async verifyPaymentByReference(reference: string): Promise<any> {
    try {
      const verificationResult = await this.verifyPayment({ reference });
      return verificationResult.data;
    } catch (error) {
      console.error("Verify payment by reference error:", error);
      throw error;
    }
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

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const secretKey = process.env.PAYSTACK_SECRET_KEY; // Fixed typo: use SECRET_KEY
      const hash = crypto
        .createHmac("sha512", secretKey)
        .update(payload, "utf8")
        .digest("hex");

      return hash === signature;
    } catch (error) {
      console.error("Webhook signature verification error:", error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhook(
    webhookData: PaystackWebhookDto,
    signature: string,
    rawPayload: string
  ): Promise<any> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(rawPayload, signature)) {
        throw new HttpException(
          "Invalid webhook signature",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Process different webhook events
      switch (webhookData.event) {
        case "charge.success":
          await this.handleSuccessfulPayment(webhookData.data);
          break;
        case "charge.failed":
          await this.handleFailedPayment(webhookData.data);
          break;
        case "refund.processed":
          await this.handleRefundProcessed(webhookData.data);
          break;
        default:
          console.log(`Unhandled webhook event: ${webhookData.event}`);
      }

      return new DataResponseDto(
        { event: webhookData.event },
        true,
        "Webhook processed successfully"
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error("Process webhook error:", error);
      throw new HttpException(
        "Failed to process webhook",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Handle successful payment webhook
   */
  private async handleSuccessfulPayment(paymentData: any): Promise<void> {
    try {
      console.log("Processing successful payment:", paymentData.reference);

      // TODO: Implement business logic for successful payment
      // - Update order status
      // - Send confirmation email
      // - Update inventory
      // - Log payment details
    } catch (error) {
      console.error("Handle successful payment error:", error);
      throw error;
    }
  }

  /**
   * Handle failed payment webhook
   */
  private async handleFailedPayment(paymentData: any): Promise<void> {
    try {
      console.log("Processing failed payment:", paymentData.reference);

      // TODO: Implement business logic for failed payment
      // - Update order status to failed
      // - Send failure notification
      // - Log failure details
    } catch (error) {
      console.error("Handle failed payment error:", error);
      throw error;
    }
  }

  /**
   * Handle refund processed webhook
   */
  private async handleRefundProcessed(refundData: any): Promise<void> {
    try {
      console.log("Processing refund:", refundData.id);

      // TODO: Implement business logic for processed refund
      // - Update order status
      // - Update inventory
      // - Send refund confirmation
      // - Log refund details
    } catch (error) {
      console.error("Handle refund processed error:", error);
      throw error;
    }
  }

  /**
   * Get transaction details by reference
   */
  async getTransactionDetails(reference: string): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService
          .get(`${this.baseUrl}/transaction/verify/${reference}`, {
            headers: this.getHeaders(),
          })
          .pipe(
            map((resp) => resp.data),
            catchError((error) => {
              console.error(
                "Get transaction details error:",
                error.response?.data || error.message
              );
              throw new HttpException(
                error.response?.data?.message ||
                  "Failed to get transaction details",
                error.response?.status || HttpStatus.BAD_REQUEST
              );
            })
          )
      );

      return new DataResponseDto(
        response.data,
        true,
        "Transaction details retrieved successfully"
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error("Get transaction details error:", error);
      throw new HttpException(
        "Failed to get transaction details",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * List transactions with pagination
   */
  async listTransactions(page: number = 1, perPage: number = 50): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService
          .get(`${this.baseUrl}/transaction?page=${page}&perPage=${perPage}`, {
            headers: this.getHeaders(),
          })
          .pipe(
            map((resp) => resp.data),
            catchError((error) => {
              console.error(
                "List transactions error:",
                error.response?.data || error.message
              );
              throw new HttpException(
                error.response?.data?.message || "Failed to list transactions",
                error.response?.status || HttpStatus.BAD_REQUEST
              );
            })
          )
      );

      return new DataResponseDto(
        response.data,
        true,
        "Transactions retrieved successfully"
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error("List transactions error:", error);
      throw new HttpException(
        "Failed to list transactions",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
