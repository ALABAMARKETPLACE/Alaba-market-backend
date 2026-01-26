import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import * as crypto from "crypto";

@Injectable()
export class PaystackService {
  private readonly baseUrl = "https://api.paystack.co";
  private readonly secretKey = process.env.PAYSTACK_SECRET_KEY;
  private readonly webhookSecret = process.env.WEBHOOK_SECRET;

  constructor(private readonly httpService: HttpService) {}

  /**
   * Initialize a Paystack transaction
   * Used for normal payments and split payments
   */
  async initializePayment(payload: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/transaction/initialize`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
            },
          }
        )
      );

      if (!response.data?.status) {
        throw new Error(response.data?.message || "Initialization failed");
      }

      return response.data; // { status, message, data }
    } catch (error) {
      throw new InternalServerErrorException(
        `Paystack initialize failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Verify a Paystack transaction
   * Used by webhook handler and manual verification
   */
  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
            },
          }
        )
      );

      if (!response.data?.status) {
        throw new Error(response.data?.message || "Verification failed");
      }

      return response.data.data; // return ONLY transaction data
    } catch (error) {
      throw new InternalServerErrorException(
        `Paystack verify failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Create a transfer (for settlements/payouts)
   */
  async createTransfer(payload: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/transfer`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
            },
          }
        )
      );

      if (!response.data?.status) {
        throw new Error(response.data?.message || "Transfer failed");
      }

      return response.data.data;
    } catch (error) {
      throw new InternalServerErrorException(
        `Paystack transfer failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Validate Paystack webhook signature
   */
  validateWebhook(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret || !signature) return false;

    const expectedHash = crypto
      .createHmac("sha512", this.webhookSecret)
      .update(rawBody)
      .digest("hex");

    return expectedHash === signature;
  }
}

export default PaystackService;
