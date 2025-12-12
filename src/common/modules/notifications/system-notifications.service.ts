import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class SystemNotificationsService {
  private readonly logger = new Logger(SystemNotificationsService.name);

  constructor(private notificationsService: NotificationsService) {}

  // Send welcome notification to new users
  async sendWelcomeNotification(userId: string, userRole: string) {
    const messages = {
      driver: {
        title: '🚗 Welcome to Our Platform!',
        message: 'Start accepting deliveries and earn money today!',
      },
      company: {
        title: '🏢 Welcome to Our Platform!',
        message: 'Start managing your deliveries efficiently!',
      },
      customer: {
        title: '🎉 Welcome to Our Platform!',
        message: 'Order delivery services with just a few taps!',
      },
    };

    const notification = messages[userRole] || messages.customer;

    await this.notificationsService.sendPushNotification(
      userId,
      notification.title,
      notification.message,
      { type: 'welcome' },
    );
  }

  // Daily summary for drivers
  @Cron(CronExpression.EVERY_DAY_AT_8PM)
  async sendDriverDailySummary() {
    // Get all active drivers
    const drivers = await this.getActiveDrivers();

    for (const driver of drivers) {
      const stats = await this.getDriverDailyStats(driver.userId);

      await this.notificationsService.sendPushNotification(
        driver.userId,
        "📊 Today's Summary",
        `You completed ${stats.deliveries} deliveries and earned $${stats.earnings.toFixed(2)} today!`,
        {
          deliveries: stats.deliveries,
          earnings: stats.earnings,
          type: 'daily_summary',
        },
      );
    }

    this.logger.log('Daily summaries sent to all drivers');
  }

  // Reminder for pending orders
  @Cron(CronExpression.EVERY_HOUR)
  async sendPendingOrderReminders() {
    const pendingOrders = await this.getPendingOrders();

    for (const order of pendingOrders) {
      // If order is pending for more than 1 hour
      if (this.isOrderStale(order.createdAt)) {
        await this.notificationsService.sendPushNotification(
          order.userId,
          '⏰ Order Pending',
          `Your order #${order.orderNumber} is still being processed`,
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            type: 'order_reminder',
          },
        );
      }
    }
  }

  // Promotional notifications
  async sendPromotionalNotification(userIds: string[], title: string, message: string) {
    for (const userId of userIds) {
      await this.notificationsService.sendPushNotification(userId, title, message, {
        type: 'promotional',
      });
    }

    this.logger.log(`Promotional notification sent to ${userIds.length} users`);
  }

  // Helper methods - implement based on your models
  private async getActiveDrivers() {
    return [];
  }

  private async getDriverDailyStats(userId: string) {
    return { deliveries: 0, earnings: 0 };
  }

  private async getPendingOrders() {
    return [];
  }

  private isOrderStale(createdAt: Date): boolean {
    const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation > 1;
  }
}
