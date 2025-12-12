import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user-entity';

/**
 * Seed test notifications for a company user
 * Run this in your NestJS app or create an endpoint to trigger it
 */
export async function seedTestNotifications(companyUserId: string) {
  try {
    // Verify user exists
    const user = await User.findByPk(companyUserId);
    if (!user) {
      throw new Error(`User with ID ${companyUserId} not found`);
    }

    const testNotifications = [
      {
        userId: companyUserId,
        title: '🎉 New Order Assigned',
        message: 'Order #ORD-12345 has been assigned to your company. Please assign a driver.',
        type: 'order',
        isRead: false,
        actionUrl: '/orders/12345',
        data: {
          orderId: '12345',
          orderNumber: 'ORD-12345',
          type: 'order_assigned',
        },
      },
      {
        userId: companyUserId,
        title: '✅ Driver Accepted Invitation',
        message: 'John Doe has accepted your invitation and joined your team.',
        type: 'driver',
        isRead: false,
        actionUrl: '/drivers',
        data: {
          driverName: 'John Doe',
          type: 'driver_joined',
        },
      },
      {
        userId: companyUserId,
        title: '📦 Package Picked Up',
        message: 'Order #ORD-12346 has been picked up by driver Michael Smith.',
        type: 'order',
        isRead: false,
        actionUrl: '/orders/12346',
        data: {
          orderId: '12346',
          orderNumber: 'ORD-12346',
          driverName: 'Michael Smith',
          type: 'package_picked_up',
        },
      },
      {
        userId: companyUserId,
        title: '🚨 Driver Unavailable',
        message: 'Driver Sarah Johnson has marked themselves as unavailable.',
        type: 'alert',
        isRead: false,
        actionUrl: '/drivers',
        data: {
          driverName: 'Sarah Johnson',
          type: 'driver_unavailable',
        },
      },
      {
        userId: companyUserId,
        title: '💰 Payment Received',
        message: 'Payment of ₦15,000 has been received for order #ORD-12347.',
        type: 'payment',
        isRead: true, // This one is read
        actionUrl: '/orders/12347',
        data: {
          orderId: '12347',
          orderNumber: 'ORD-12347',
          amount: 15000,
          type: 'payment_received',
        },
      },
      {
        userId: companyUserId,
        title: '📬 New Marketplace Order Available',
        message: 'A new order is available in the marketplace. Accept it before someone else does!',
        type: 'order',
        isRead: false,
        actionUrl: '/marketplace',
        data: {
          type: 'marketplace_order_available',
        },
      },
      {
        userId: companyUserId,
        title: '⚠️ Subscription Expiring Soon',
        message:
          'Your subscription will expire in 7 days. Renew now to avoid service interruption.',
        type: 'system',
        isRead: false,
        actionUrl: '/settings/subscription',
        data: {
          daysLeft: 7,
          type: 'subscription_expiring',
        },
      },
      {
        userId: companyUserId,
        title: '🎯 Daily Goal Achieved',
        message: 'Congratulations! You have completed 20 deliveries today.',
        type: 'system',
        isRead: true, // This one is read
        actionUrl: '/reports',
        data: {
          deliveryCount: 20,
          type: 'goal_achieved',
        },
      },
      {
        userId: companyUserId,
        title: '🚗 Driver Performance Alert',
        message: 'Driver Alex Brown has maintained a 5-star rating for 50+ deliveries!',
        type: 'driver',
        isRead: false,
        actionUrl: '/drivers',
        data: {
          driverName: 'Alex Brown',
          rating: 5.0,
          deliveryCount: 50,
          type: 'driver_performance',
        },
      },
      {
        userId: companyUserId,
        title: '📊 Weekly Report Ready',
        message: 'Your weekly performance report is now available. Check your stats!',
        type: 'system',
        isRead: false,
        actionUrl: '/reports',
        data: {
          reportType: 'weekly',
          type: 'report_ready',
        },
      },
    ];

    // Create all notifications
    const createdNotifications = await Notification.bulkCreate(testNotifications);

    console.log(`✅ Successfully created ${createdNotifications.length} test notifications`);
    console.log(`📊 Unread count: ${testNotifications.filter((n) => !n.isRead).length}`);

    return {
      success: true,
      count: createdNotifications.length,
      unreadCount: testNotifications.filter((n) => !n.isRead).length,
      notifications: createdNotifications,
    };
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    throw error;
  }
}

/**
 * Clear all test notifications for a user
 */
export async function clearTestNotifications(companyUserId: string) {
  try {
    const deletedCount = await Notification.destroy({
      where: { userId: companyUserId },
    });

    console.log(`🗑️ Deleted ${deletedCount} notifications for user ${companyUserId}`);

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    throw error;
  }
}
