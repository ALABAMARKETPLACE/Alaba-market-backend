// src/modules/webhooks/webhooks.service.ts
import { Injectable } from '@nestjs/common';
import { PaystackService } from '../paystack/paystack.service';

@Injectable()
export class WebhooksService {
  constructor(private paystackService: PaystackService) {}

  async handlePaystackWebhook(payload: any, signature: string) {
    return this.paystackService.handleWebhook(payload, signature);
  }
}