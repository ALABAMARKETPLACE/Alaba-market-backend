// backend/src/modules/mailer/mailer.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  constructor(private readonly mailerService: NestMailerService) {}

  async sendWelcomeEmail(email: string, firstName: string, role: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Alaba Marketplace',
      template: 'welcome',
      context: {
        firstName,
        role,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
      },
    });
  }

  async sendOrderConfirmation(
    email: string,
    orderNumber: string,
    barcode: string,
    deliveryCode: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Order Confirmation & Delivery Codes',
      html: `
        <h2>Order Confirmed</h2>
        <p>Order Number: ${orderNumber}</p>
        <p><strong>Barcode (for package): ${barcode}</strong></p>
        <p><strong>Delivery Code (KEEP SECRET): ${deliveryCode}</strong></p>
        <p>The driver will need this code to complete delivery.</p>
      `,
    });
  }

  async sendPackageReceivedEmail(
    email: string,
    orderNumber: string,
    productName: string,
    trackingLink: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Package Received by Delivery Company',
      template: 'package-received',
      context: {
        orderNumber,
        productName,
        trackingLink,
      },
    });
  }

  async sendDeliverySuccessEmail(
    email: string,
    orderNumber: string,
    deliveryPhoto?: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Order Delivered Successfully',
      template: 'delivery-success',
      context: {
        orderNumber,
        deliveryPhoto,
      },
    });
  }

  async sendDeliveryFailedAlert(
    recipients: string[],
    orderNumber: string,
    wrongCode: string,
    correctCode: string,
    location: any,
  ) {
    const timestamp = new Date().toISOString();
    
    for (const email of recipients) {
      await this.mailerService.sendMail({
        to: email,
        subject: '🚨 ALERT: Failed Delivery Attempt',
        template: 'delivery-failed',
        context: {
          orderNumber,
          wrongCode,
          correctCode,
          location: JSON.stringify(location),
          timestamp,
        },
      });
    }
  }

  async sendSubscriptionExpiredEmail(email: string, companyName: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: '⚠️ Subscription Expired',
      template: 'subscription-expired',
      context: {
        companyName,
        renewUrl: `${process.env.FRONTEND_URL}/delivery-company/subscription`,
      },
    });
  }

  async sendSubscriptionActivatedEmail(
    email: string,
    companyName: string,
    expiresAt: Date,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: '✅ Subscription Activated',
      template: 'subscription-activated',
      context: {
        companyName,
        expiresAt: expiresAt.toLocaleDateString(),
      },
    });
  }

  async sendTrialEndingEmail(
    email: string,
    companyName: string,
    expiresAt: Date,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: '🔔 Free Trial Ending Soon',
      template: 'trial-ending',
      context: {
        companyName,
        expiresAt: expiresAt.toLocaleDateString(),
        subscribeUrl: `${process.env.FRONTEND_URL}/delivery-company/subscription`,
      },
    });
  }
}