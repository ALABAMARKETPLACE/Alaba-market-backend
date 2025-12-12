// // src/modules/paystack/paystack.service.ts
// import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
// import { HttpService } from '@nestjs/axios';
// import { InjectModel } from '@nestjs/sequelize';
// import { firstValueFrom } from 'rxjs';
// import { Order } from '../orders/entities/order-entity';
// import { Subscription } from '../subscription/entities/subscription.entity';
// import { InitializePaymentDto } from './dto/initialize-payment.dto';
// import { VerifyPaymentDto } from './dto/veriify-payment.dto';
// import { PaymentStatus } from '../../enums/payment-status-enums';
// import { OrdersService } from '../orders/orders.service';

// @Injectable()
// export class PaystackService {
//   private readonly baseUrl = 'https://api.paystack.co';
//   private readonly secretKey = process.env.PAYSTACK_SECRET_KEY;

//   constructor(
//     private httpService: HttpService,
//     @InjectModel(Order)
//     private orderModel: typeof Order,
//     @InjectModel(Subscription)
//     private subscriptionModel: typeof Subscription,
//     @Inject(forwardRef(() => OrdersService))
//     private ordersService: OrdersService,
//   ) {}

//   async initializePayment(dto: InitializePaymentDto) {
//     try {
//       // Ensure we have an order and attach reference to it for later lookup
//       if (!dto.orderId) {
//         throw new BadRequestException('orderId is required for payment initialization');
//       }

//       const order = await this.orderModel.findByPk(dto.orderId);
//       if (!order) {
//         throw new BadRequestException('Order not found for payment initialization');
//       }

//       const reference = dto.reference || this.generateReference();

//       // Persist reference on order so we can match it on verification/webhook
//       await order.update({ paystackReference: reference });

//       // Frontend sends amount in Naira; Paystack expects integer amount in kobo.
//       const amountKobo = Math.round(dto.amount * 100);
//       if (!Number.isInteger(amountKobo) || amountKobo < 1) {
//         throw new BadRequestException(
//           'Invalid amount. Amount must be a positive integer when converted to kobo.',
//         );
//       }

//       const response = await firstValueFrom(
//         this.httpService.post(
//           `${this.baseUrl}/transaction/initialize`,
//           {
//             email: dto.email,
//             amount: amountKobo,
//             reference,
//             callback_url:
//               dto.callbackUrl ||
//               `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
//             metadata: {
//               ...(dto.metadata || {}),
//               orderId: dto.orderId,
//             },
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${this.secretKey}`,
//               'Content-Type': 'application/json',
//             },
//           },
//         ),
//       );

//       const data = response.data?.data || response.data;

//       return {
//         success: true,
//         data: {
//           authorization_url: data.authorization_url,
//           access_code: data.access_code,
//           reference: data.reference,
//         },
//       };
//     } catch (error) {
//       throw new BadRequestException(
//         error.response?.data?.message || 'Payment initialization failed',
//       );
//     }
//   }

//   async verifyPayment(dto: VerifyPaymentDto) {
//     const isDev = process.env.NODE_ENV !== 'production';

//     // In development, mock verification as successful to avoid external network/key issues
//     if (isDev) {
//       const order = await this.orderModel.findOne({
//         where: { paystackReference: dto.reference },
//       });

//       if (!order) {
//         throw new BadRequestException('Order not found for this payment reference');
//       }

//       await this.updatePaymentStatus(dto.reference, PaymentStatus.SUCCESS);

//       return {
//         success: true,
//         data: {
//           reference: dto.reference,
//           amount: Number(order.totalPrice),
//           status: 'success',
//           order,
//         },
//       };
//     }

//     try {
//       const response = await firstValueFrom(
//         this.httpService.get(`${this.baseUrl}/transaction/verify/${dto.reference}`, {
//           headers: {
//             Authorization: `Bearer ${this.secretKey}`,
//           },
//         }),
//       );

//       const paymentData = response.data.data;

//       let order: Order | null = null;
//       if (paymentData.status === 'success') {
//         // Update order or subscription
//         await this.updatePaymentStatus(dto.reference, PaymentStatus.SUCCESS);

//         // Fetch the related order to return to frontend
//         order = await this.orderModel.findOne({
//           where: { paystackReference: dto.reference },
//         });
//       }

//       return {
//         success: paymentData.status === 'success',
//         data: {
//           reference: paymentData.reference,
//           amount: paymentData.amount / 100,
//           status: paymentData.status,
//           order,
//         },
//       };
//     } catch (error) {
//       throw new BadRequestException(error.response?.data?.message || 'Payment verification failed');
//     }
//   }

//   async createSplitPayment(orderId: string, sellers: Array<{ sellerId: string; amount: number }>) {
//     // This would create subaccounts and split payments
//     // Implementation depends on Paystack subaccount setup
//     const splitConfig = {
//       type: 'flat',
//       bearer_type: 'account',
//       subaccounts: sellers.map((seller) => ({
//         subaccount: `ACCT_${seller.sellerId}`, // Your Paystack subaccount codes
//         share: seller.amount * 100,
//       })),
//     };

//     return splitConfig;
//   }

//   async handleWebhook(payload: any, signature: string) {
//     const crypto = require('crypto');
//     const hash = crypto
//       .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
//       .update(JSON.stringify(payload))
//       .digest('hex');

//     if (hash !== signature) {
//       throw new BadRequestException('Invalid signature');
//     }

//     const { event, data } = payload;

//     switch (event) {
//       case 'charge.success':
//         await this.handleSuccessfulPayment(data);
//         break;
//       case 'subscription.create':
//       case 'subscription.enable':
//         await this.handleSubscriptionEvent(data);
//         break;
//       default:
//         console.log(`Unhandled webhook event: ${event}`);
//     }

//     return { status: 'success' };
//   }

//   private async handleSuccessfulPayment(data: any) {
//     const reference = data.reference;
//     await this.updatePaymentStatus(reference, PaymentStatus.SUCCESS);
//   }

//   private async handleSubscriptionEvent(data: any) {
//     // Handle subscription webhook events
//     console.log('Subscription event:', data);
//   }

//   private async updatePaymentStatus(reference: string, status: PaymentStatus) {
//     // Check if it's an order payment
//     const order = await this.orderModel.findOne({
//       where: { paystackReference: reference },
//     });

//     if (order) {
//       await order.update({ paymentStatus: status });

//       // If payment successful, trigger payment confirmation flow with notifications
//       if (status === PaymentStatus.SUCCESS) {
//         try {
//           await this.ordersService.confirmPayment(order.id);
//         } catch (error) {
//           console.error(
//             'Failed to confirm payment and send notifications:',
//             error?.message || error,
//           );
//         }
//       }
//       return;
//     }

//     // Check if it's a subscription payment
//     const subscription = await this.subscriptionModel.findOne({
//       where: { paystackReference: reference },
//     });

//     if (subscription) {
//       await subscription.update({ paymentStatus: status });
//     }
//   }

//   private generateReference(): string {
//     return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
//   }
// }

// src/modules/paystack/paystack.service.ts
import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/sequelize';
import { firstValueFrom } from 'rxjs';
import { Order } from '../orders/entities/order-entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { User } from '../users/entities/user-entity';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { VerifyPaymentDto } from './dto/veriify-payment.dto';
import { PaymentStatus } from '../../enums/payment-status-enums';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey = process.env.PAYSTACK_SECRET_KEY;

  constructor(
    private httpService: HttpService,
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(Subscription)
    private subscriptionModel: typeof Subscription,
    @InjectModel(User)
    private userModel: typeof User,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
  ) {}

  async initializePayment(dto: InitializePaymentDto) {
    try {
      // Ensure we have an order and attach reference to it for later lookup
      if (!dto.orderId) {
        throw new BadRequestException('orderId is required for payment initialization');
      }

      const order = await this.orderModel.findByPk(dto.orderId, {
        include: [
          { model: User, as: 'buyer' },
          { model: User, as: 'seller' },
        ],
      });

      if (!order) {
        throw new BadRequestException('Order not found for payment initialization');
      }

      const reference = dto.reference || this.generateReference();

      // Persist reference on order so we can match it on verification/webhook
      await order.update({ paystackReference: reference });

      // Frontend sends amount in Naira; Paystack expects integer amount in kobo.
      const amountKobo = Math.round(dto.amount * 100);
      if (!Number.isInteger(amountKobo) || amountKobo < 1) {
        throw new BadRequestException(
          'Invalid amount. Amount must be a positive integer when converted to kobo.',
        );
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/transaction/initialize`,
          {
            email: dto.email,
            amount: amountKobo,
            reference,
            callback_url:
              dto.callbackUrl ||
              `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
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

      // 🔔 PUSH NOTIFICATION: Payment initialized
      try {
        await this.notificationsService.sendPushNotification(
          order.buyerId,
          '💳 Payment Processing',
          `Payment of ₦${dto.amount.toFixed(2)} initialized for order #${order.id}`,
          {
            orderId: order.id,
            amount: dto.amount,
            reference,
            type: 'payment_initialized',
          },
        );
      } catch (error) {
        this.logger.error('Failed to send payment initialization notification:', error);
      }

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

    // In development, mock verification as successful
    if (isDev) {
      const order = await this.orderModel.findOne({
        where: { paystackReference: dto.reference },
        include: [
          { model: User, as: 'buyer' },
          { model: User, as: 'seller' },
        ],
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
        this.httpService.get(`${this.baseUrl}/transaction/verify/${dto.reference}`, {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }),
      );

      const paymentData = response.data.data;

      let order: Order | null = null;
      if (paymentData.status === 'success') {
        // Update order or subscription
        await this.updatePaymentStatus(dto.reference, PaymentStatus.SUCCESS);

        // Fetch the related order to return to frontend
        order = await this.orderModel.findOne({
          where: { paystackReference: dto.reference },
          include: [
            { model: User, as: 'buyer' },
            { model: User, as: 'seller' },
          ],
        });
      } else if (paymentData.status === 'failed') {
        await this.updatePaymentStatus(dto.reference, PaymentStatus.FAILED);

        // 🔔 PUSH NOTIFICATION: Payment failed
        order = await this.orderModel.findOne({
          where: { paystackReference: dto.reference },
        });

        if (order) {
          try {
            await this.notificationsService.sendPushNotification(
              order.buyerId,
              '❌ Payment Failed',
              `Payment of ₦${(paymentData.amount / 100).toFixed(2)} failed for order #${order.id}`,
              {
                orderId: order.id,
                amount: paymentData.amount / 100,
                reference: dto.reference,
                reason: paymentData.gateway_response || 'Payment unsuccessful',
                type: 'payment_failed',
              },
            );
          } catch (error) {
            this.logger.error('Failed to send payment failed notification:', error);
          }
        }
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
      throw new BadRequestException(error.response?.data?.message || 'Payment verification failed');
    }
  }

  async createSplitPayment(orderId: string, sellers: Array<{ sellerId: string; amount: number }>) {
    // This would create subaccounts and split payments
    const splitConfig = {
      type: 'flat',
      bearer_type: 'account',
      subaccounts: sellers.map((seller) => ({
        subaccount: `ACCT_${seller.sellerId}`,
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
      case 'charge.failed':
        await this.handleFailedPayment(data);
        break;
      case 'subscription.create':
      case 'subscription.enable':
        await this.handleSubscriptionEvent(data);
        break;
      case 'subscription.disable':
        await this.handleSubscriptionDisabled(data);
        break;
      case 'refund.processed':
        await this.handleRefundProcessed(data);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return { status: 'success' };
  }

  private async handleSuccessfulPayment(data: any) {
    const reference = data.reference;
    const amount = data.amount / 100; // Convert from kobo to naira

    await this.updatePaymentStatus(reference, PaymentStatus.SUCCESS);

    // 🔔 PUSH NOTIFICATION: Payment successful (handled in updatePaymentStatus via confirmPayment)
    this.logger.log(`Payment successful for reference: ${reference}`);
  }

  private async handleFailedPayment(data: any) {
    const reference = data.reference;
    const amount = data.amount / 100;
    const reason = data.gateway_response || 'Payment unsuccessful';

    await this.updatePaymentStatus(reference, PaymentStatus.FAILED);

    // 🔔 PUSH NOTIFICATION: Payment failed
    try {
      const order = await this.orderModel.findOne({
        where: { paystackReference: reference },
      });

      if (order) {
        await this.notificationsService.sendPushNotification(
          order.buyerId,
          '❌ Payment Failed',
          `Payment of ₦${amount.toFixed(2)} failed. ${reason}`,
          {
            orderId: order.id,
            amount,
            reference,
            reason,
            type: 'payment_failed',
          },
        );

        // Also notify seller
        if (order.sellerId) {
          await this.notificationsService.sendPushNotification(
            order.sellerId,
            '⚠️ Payment Failed',
            `Payment failed for order #${order.id}`,
            {
              orderId: order.id,
              amount,
              type: 'payment_failed_seller',
            },
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to send payment failed notification:', error);
    }

    this.logger.log(`Payment failed for reference: ${reference} - ${reason}`);
  }

  private async handleSubscriptionEvent(data: any) {
    const subscriptionCode = data.subscription_code;
    const customerEmail = data.customer?.email;

    this.logger.log('Subscription event:', data);

    // 🔔 PUSH NOTIFICATION: Subscription activated
    try {
      if (customerEmail) {
        const user = await this.userModel.findOne({ where: { email: customerEmail } });

        if (user) {
          await this.notificationsService.sendPushNotification(
            user.id,
            '✅ Subscription Activated',
            'Your subscription has been activated successfully',
            {
              subscriptionCode,
              type: 'subscription_activated',
            },
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to send subscription activation notification:', error);
    }
  }

  private async handleSubscriptionDisabled(data: any) {
    const subscriptionCode = data.subscription_code;
    const customerEmail = data.customer?.email;

    this.logger.log('Subscription disabled:', data);

    // 🔔 PUSH NOTIFICATION: Subscription disabled
    try {
      if (customerEmail) {
        const user = await this.userModel.findOne({ where: { email: customerEmail } });

        if (user) {
          await this.notificationsService.sendPushNotification(
            user.id,
            '⚠️ Subscription Disabled',
            'Your subscription has been disabled. Please renew to continue',
            {
              subscriptionCode,
              type: 'subscription_disabled',
            },
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to send subscription disabled notification:', error);
    }
  }

  private async handleRefundProcessed(data: any) {
    const reference = data.transaction_reference;
    const amount = data.amount / 100;

    this.logger.log('Refund processed:', data);

    // 🔔 PUSH NOTIFICATION: Refund processed
    try {
      const order = await this.orderModel.findOne({
        where: { paystackReference: reference },
      });

      if (order) {
        await this.notificationsService.sendPushNotification(
          order.buyerId,
          '💰 Refund Processed',
          `A refund of ₦${amount.toFixed(2)} has been processed for order #${order.id}`,
          {
            orderId: order.id,
            amount,
            reference,
            type: 'refund_processed',
          },
        );

        // Notify seller about refund
        if (order.sellerId) {
          await this.notificationsService.sendPushNotification(
            order.sellerId,
            '💰 Refund Issued',
            `A refund of ₦${amount.toFixed(2)} has been issued for order #${order.id}`,
            {
              orderId: order.id,
              amount,
              type: 'refund_issued_seller',
            },
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to send refund notification:', error);
    }
  }

  private async updatePaymentStatus(reference: string, status: PaymentStatus) {
    // Check if it's an order payment
    const order = await this.orderModel.findOne({
      where: { paystackReference: reference },
    });

    if (order) {
      await order.update({ paymentStatus: status });

      // If payment successful, trigger payment confirmation flow with notifications
      if (status === PaymentStatus.SUCCESS) {
        try {
          await this.ordersService.confirmPayment(order.id);
          this.logger.log(`Payment confirmed for order ${order.id}`);
        } catch (error) {
          console.error(
            'Failed to confirm payment and send notifications:',
            error?.message || error,
          );
        }
      }
      return;
    }

    // Check if it's a subscription payment
    const subscription = await this.subscriptionModel.findOne({
      where: { paystackReference: reference },
    });

    if (subscription) {
      await subscription.update({ paymentStatus: status });

      // 🔔 PUSH NOTIFICATION: Subscription payment status
      try {
        const user = await this.userModel.findByPk(subscription.userId);

        if (user && status === PaymentStatus.SUCCESS) {
          await this.notificationsService.sendPushNotification(
            user.id,
            '✅ Subscription Payment Successful',
            'Your subscription payment has been processed successfully',
            {
              subscriptionId: subscription.id,
              amount: Number(subscription.amount),
              type: 'subscription_payment_success',
            },
          );
        } else if (user && status === PaymentStatus.FAILED) {
          await this.notificationsService.sendPushNotification(
            user.id,
            '❌ Subscription Payment Failed',
            'Your subscription payment could not be processed. Please update your payment method',
            {
              subscriptionId: subscription.id,
              type: 'subscription_payment_failed',
            },
          );
        }
      } catch (error) {
        this.logger.error('Failed to send subscription payment notification:', error);
      }
    }
  }

  // Request refund for an order
  async requestRefund(orderId: string, userId: string, reason: string) {
    const order = await this.orderModel.findByPk(orderId, {
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException('You can only request refund for your own orders');
    }

    if (!order.paystackReference) {
      throw new BadRequestException('No payment reference found for this order');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/refund`,
          {
            transaction: order.paystackReference,
            amount: Math.round(Number(order.totalPrice) * 100), // Convert to kobo
          },
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // 🔔 PUSH NOTIFICATION: Refund requested
      try {
        await this.notificationsService.sendPushNotification(
          userId,
          '💰 Refund Requested',
          `Your refund request for order #${order.id} is being processed`,
          {
            orderId: order.id,
            amount: Number(order.totalPrice),
            reason,
            type: 'refund_requested',
          },
        );

        // Notify seller
        if (order.sellerId) {
          await this.notificationsService.sendPushNotification(
            order.sellerId,
            '⚠️ Refund Request',
            `Customer has requested a refund for order #${order.id}`,
            {
              orderId: order.id,
              amount: Number(order.totalPrice),
              reason,
              type: 'refund_requested_seller',
            },
          );
        }
      } catch (error) {
        this.logger.error('Failed to send refund request notification:', error);
      }

      return {
        success: true,
        message: 'Refund request submitted successfully',
        data: response.data,
      };
    } catch (error) {
      throw new BadRequestException(error.response?.data?.message || 'Refund request failed');
    }
  }

  private generateReference(): string {
    return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}
