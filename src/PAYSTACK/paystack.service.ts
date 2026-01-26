import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import * as crypto from "crypto";

@Injectable()
export class PaystackService {
  private readonly baseUrl = "https://api.paystack.co";
  private readonly secret = process.env.PAYSTACK_SECRET_KEY;
  private readonly webhookSecret = process.env.WEBHOOK_SECRET;

  constructor(private readonly httpService: HttpService) {}

  async initializeTransaction(payload: any) {
    try {
      const res = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/transaction/initialize`, payload, {
          headers: { Authorization: `Bearer ${this.secret}` },
        })
      );
      return res.data;
    } catch (err) {
      throw new InternalServerErrorException(
        `Paystack initialize failed: ${err.response?.data?.message || err.message}`
      );
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${this.secret}` },
        })
      );
      return res.data;
    } catch (err) {
      throw new InternalServerErrorException(
        `Paystack verify failed: ${err.response?.data?.message || err.message}`
      );
    }
  }

  async createTransfer(payload: any) {
    try {
      const res = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/transfer`, payload, {
          headers: { Authorization: `Bearer ${this.secret}` },
        })
      );
      return res.data;
    } catch (err) {
      throw new InternalServerErrorException(
        `Paystack transfer failed: ${err.response?.data?.message || err.message}`
      );
    }
  }

  validateWebhook(rawBody: string, signatureHeader: string) {
    if (!this.webhookSecret) return false;
    const expected = crypto
      .createHmac("sha512", this.webhookSecret)
      .update(rawBody)
      .digest("hex");
    return expected === signatureHeader;
  }
}

export default PaystackService;
