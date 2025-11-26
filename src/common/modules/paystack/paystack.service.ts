// src/modules/paystack/paystack.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/sequelize';
import { firstValueFrom } from 'rxjs';
import { Order } from '../orders/entities/order-entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { InitializePaymentDto} from './dto/initialize-payment.dto';
import { VerifyPaymentDto } from './dto/veriify-payment.dto';
import { PaymentStatus } from '../../enums/payment-status-enums';

@Injectable()
export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey = process.env.PAYSTACK_SECRET_KEY;

  constructor(
    private httpService: HttpService,
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(Subscription)
    private subscriptionModel: typeof Subscription,
  ) {}

  async initializePayment(dto: InitializePaymentDto) {
    try {
      // Ensure we have an order and attach reference to it for later lookup
      if (!dto.orderId) {
        throw new BadRequestException('orderId is required for payment initialization');
      }

      const order = await this.orderModel.findByPk(dto.orderId);
      if (!order) {
        throw new BadRequestException('Order not found for payment initialization');
      }

      const reference = dto.reference || this.generateReference();

      // Persist reference on order so we can match it on verification/webhook
      await order.update({ paystackReference: reference });

      // Frontend sends amount in Naira; Paystack expects integer amount in kobo.
      const amountKobo = Math.round(dto.amount * 100);
      if (!Number.isInteger(amountKobo) || amountKobo < 1) {
        throw new BadRequestException('Invalid amount. Amount must be a positive integer when converted to kobo.');
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/transaction/initialize`,
          {
            email: dto.email,
            amount: amountKobo,
            reference,
            callback_url:
              dto.callbackUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
            metadata: {
              ...(dto.metadata || {}),
              orderId: dto.orderId,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data = response.data?.data || response.data;

      return {
        success: true,
        data: {
          authorization_url: data.authorization_url,
          access_code: data.access_code,
          reference: data.reference,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        error.response?.data?.message || 'Payment initialization failed',
      );
    }
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    const isDev = process.env.NODE_ENV !== 'production';

    // In development, mock verification as successful to avoid external network/key issues
    if (isDev) {
      const order = await this.orderModel.findOne({
        where: { paystackReference: dto.reference },
      });

      if (!order) {
        throw new BadRequestException('Order not found for this payment reference');
      }

      await this.updatePaymentStatus(dto.reference, PaymentStatus.SUCCESS);

      return {
        success: true,
        data: {
          reference: dto.reference,
          amount: Number(order.totalPrice),
          status: 'success',
          order,
        },
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/transaction/verify/${dto.reference}`,
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
            },
          },
        ),
      );

      const paymentData = response.data.data;

      let order: Order | null = null;
      if (paymentData.status === 'success') {
        // Update order or subscription
        await this.updatePaymentStatus(dto.reference, PaymentStatus.SUCCESS);

        // Fetch the related order to return to frontend
        order = await this.orderModel.findOne({
          where: { paystackReference: dto.reference },
        });
      }

      return {
        success: paymentData.status === 'success',
        data: {
          reference: paymentData.reference,
          amount: paymentData.amount / 100,
          status: paymentData.status,
          order,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        error.response?.data?.message || 'Payment verification failed',
      );
    }
  }

  async createSplitPayment(orderId: string, sellers: Array<{ sellerId: string; amount: number }>) {
    // This would create subaccounts and split payments
    // Implementation depends on Paystack subaccount setup
    const splitConfig = {
      type: 'flat',
      bearer_type: 'account',
      subaccounts: sellers.map(seller => ({
        subaccount: `ACCT_${seller.sellerId}`, // Your Paystack subaccount codes
        share: seller.amount * 100,
      })),
    };

    return splitConfig;
  }

  async handleWebhook(payload: any, signature: string) {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid signature');
    }

    const { event, data } = payload;

    switch (event) {
      case 'charge.success':
        await this.handleSuccessfulPayment(data);
        break;
      case 'subscription.create':
      case 'subscription.enable':
        await this.handleSubscriptionEvent(data);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return { status: 'success' };
  }

  private async handleSuccessfulPayment(data: any) {
    const reference = data.reference;
    await this.updatePaymentStatus(reference, PaymentStatus.SUCCESS);
  }

  private async handleSubscriptionEvent(data: any) {
    // Handle subscription webhook events
    console.log('Subscription event:', data);
  }

  private async updatePaymentStatus(reference: string, status: PaymentStatus) {
    // Check if it's an order payment
    const order = await this.orderModel.findOne({
      where: { paystackReference: reference },
    });

    if (order) {
      await order.update({ paymentStatus: status });
      return;
    }

    // Check if it's a subscription payment
    const subscription = await this.subscriptionModel.findOne({
      where: { paystackReference: reference },
    });

    if (subscription) {
      await subscription.update({ paymentStatus: status });
    }
  }

  private generateReference(): string {
    return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}
