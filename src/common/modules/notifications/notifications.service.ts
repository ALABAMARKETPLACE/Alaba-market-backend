// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/sequelize';
// import { Notification } from './entities/notification.entity';
// import { CreateNotificationDto } from './dto/create-notification.dto';
// import { RegisterPushTokenDto } from './dto/register-push-token.dto';
// import { Op } from 'sequelize';
// import { PushToken } from './entities/push-token.entity';

// @Injectable()
// export class NotificationsService {
//   private readonly logger = new Logger(NotificationsService.name);

//   constructor(
//     @InjectModel(Notification)
//     private notificationModel: typeof Notification,
//     @InjectModel(PushToken)
//     private pushTokenModel: typeof PushToken,
//   ) {}

//   // Create notification for specific users
//   async create(createDto: CreateNotificationDto, userId?: string) {
//     if (createDto.recipientIds && createDto.recipientIds.length > 0) {
//       // Create for multiple recipients
//       const notifications = await Promise.all(
//         createDto.recipientIds.map((recipientId) =>
//           this.notificationModel.create({
//             userId: recipientId,
//             title: createDto.title,
//             message: createDto.message,
//             type: createDto.type,
//             actionUrl: createDto.actionUrl,
//             data: createDto.data,
//           }),
//         ),
//       );
//       return notifications;
//     }

//     // Create for single user
//     if (!userId) {
//       throw new Error('userId is required when recipientIds not provided');
//     }

//     return this.notificationModel.create({
//       userId,
//       title: createDto.title,
//       message: createDto.message,
//       type: createDto.type,
//       actionUrl: createDto.actionUrl,
//       data: createDto.data,
//     });
//   }

//   // Get all notifications for a user with pagination
//   async findAll(
//     userId: string,
//     page: number = 1,
//     limit: number = 20,
//     isRead?: boolean,
//     type?: string,
//   ) {
//     const offset = (page - 1) * limit;

//     const where: any = { userId };
//     if (isRead !== undefined) {
//       where.isRead = isRead;
//     }
//     if (type) {
//       where.type = type;
//     }

//     const { rows: notifications, count: total } = await this.notificationModel.findAndCountAll({
//       where,
//       order: [['createdAt', 'DESC']],
//       limit,
//       offset,
//     });

//     const unread = await this.notificationModel.count({
//       where: { userId, isRead: false },
//     });

//     return {
//       notifications,
//       unread,
//       total,
//       page,
//       totalPages: Math.ceil(total / limit),
//     };
//   }

//   // Get single notification
//   async findOne(id: string, userId: string) {
//     return this.notificationModel.findOne({
//       where: { id, userId },
//     });
//   }

//   // Mark as read
//   async markAsRead(id: string, userId: string) {
//     const notification = await this.notificationModel.findOne({
//       where: { id, userId },
//     });

//     if (!notification) {
//       throw new Error('Notification not found');
//     }

//     await notification.update({ isRead: true });
//     return notification;
//   }

//   // Mark all as read
//   async markAllAsRead(userId: string) {
//     const [updatedCount] = await this.notificationModel.update(
//       { isRead: true },
//       { where: { userId, isRead: false } },
//     );

//     return { updatedCount };
//   }

//   // Mark multiple as read
//   async markMultipleAsRead(notificationIds: string[], userId: string) {
//     const [updatedCount] = await this.notificationModel.update(
//       { isRead: true },
//       { where: { id: { [Op.in]: notificationIds }, userId } },
//     );

//     return { updatedCount };
//   }

//   // Delete notification
//   async delete(id: string, userId: string) {
//     const notification = await this.notificationModel.findOne({
//       where: { id, userId },
//     });

//     if (!notification) {
//       throw new Error('Notification not found');
//     }

//     await notification.destroy();
//     return { success: true };
//   }

//   // Delete multiple notifications
//   async deleteMultiple(notificationIds: string[], userId: string) {
//     const deletedCount = await this.notificationModel.destroy({
//       where: { id: { [Op.in]: notificationIds }, userId },
//     });

//     return { deletedCount };
//   }

//   // Clear all notifications for user
//   async clearAll(userId: string) {
//     const deletedCount = await this.notificationModel.destroy({
//       where: { userId },
//     });

//     return { deletedCount };
//   }

//   // Get unread count
//   async getUnreadCount(userId: string) {
//     const unreadCount = await this.notificationModel.count({
//       where: { userId, isRead: false },
//     });

//     return { unreadCount };
//   }

//   // Create notification for order update
//   async createOrderNotification(userId: string, orderId: string, title: string, message: string) {
//     return this.notificationModel.create({
//       userId,
//       title,
//       message,
//       type: 'order',
//       actionUrl: `/orders/${orderId}`,
//       data: { orderId },
//     });
//   }

//   // Create notification for payment
//   async createPaymentNotification(userId: string, orderId: string, title: string, message: string) {
//     return this.notificationModel.create({
//       userId,
//       title,
//       message,
//       type: 'payment',
//       actionUrl: `/orders/${orderId}`,
//       data: { orderId },
//     });
//   }

//   // Create notification for driver invitation
//   async createInvitationNotification(userId: string, invitationId: string, companyName: string) {
//     return this.notificationModel.create({
//       userId,
//       title: 'Driver Invitation',
//       message: `You have been invited to join ${companyName}`,
//       type: 'invitation',
//       actionUrl: `/invitations/${invitationId}`,
//       data: { invitationId, companyName },
//     });
//   }
// }

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { Op } from 'sequelize';
import { PushToken } from './entities/push-token.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification)
    private notificationModel: typeof Notification,
    @InjectModel(PushToken)
    private pushTokenModel: typeof PushToken,
  ) {}

  async create(createDto: CreateNotificationDto, userId?: string) {
    if (createDto.recipientIds && createDto.recipientIds.length > 0) {
      // Create for multiple recipients
      const notifications = await Promise.all(
        createDto.recipientIds.map((recipientId) =>
          this.notificationModel.create({
            userId: recipientId,
            title: createDto.title,
            message: createDto.message,
            type: createDto.type,
            actionUrl: createDto.actionUrl,
            data: createDto.data,
          }),
        ),
      );
      return notifications;
    }

    // Create for single user
    if (!userId) {
      throw new Error('userId is required when recipientIds not provided');
    }

    return this.notificationModel.create({
      userId,
      title: createDto.title,
      message: createDto.message,
      type: createDto.type,
      actionUrl: createDto.actionUrl,
      data: createDto.data,
    });
  }

  // Get all notifications for a user with pagination
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
    isRead?: boolean,
    type?: string,
  ) {
    const offset = (page - 1) * limit;

    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }
    if (type) {
      where.type = type;
    }

    const { rows: notifications, count: total } = await this.notificationModel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const unread = await this.notificationModel.count({
      where: { userId, isRead: false },
    });

    return {
      notifications,
      unread,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get single notification
  async findOne(id: string, userId: string) {
    return this.notificationModel.findOne({
      where: { id, userId },
    });
  }

  // Mark as read
  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationModel.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.update({ isRead: true });
    return notification;
  }

  // Mark all as read
  async markAllAsRead(userId: string) {
    const [updatedCount] = await this.notificationModel.update(
      { isRead: true },
      { where: { userId, isRead: false } },
    );

    return { updatedCount };
  }

  // Mark multiple as read
  async markMultipleAsRead(notificationIds: string[], userId: string) {
    const [updatedCount] = await this.notificationModel.update(
      { isRead: true },
      { where: { id: { [Op.in]: notificationIds }, userId } },
    );

    return { updatedCount };
  }

  // Delete notification
  async delete(id: string, userId: string) {
    const notification = await this.notificationModel.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.destroy();
    return { success: true };
  }

  // Delete multiple notifications
  async deleteMultiple(notificationIds: string[], userId: string) {
    const deletedCount = await this.notificationModel.destroy({
      where: { id: { [Op.in]: notificationIds }, userId },
    });

    return { deletedCount };
  }

  // Clear all notifications for user
  async clearAll(userId: string) {
    const deletedCount = await this.notificationModel.destroy({
      where: { userId },
    });

    return { deletedCount };
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    const unreadCount = await this.notificationModel.count({
      where: { userId, isRead: false },
    });

    return { unreadCount };
  }

  // Create notification for order update
  async createOrderNotification(userId: string, orderId: string, title: string, message: string) {
    return this.notificationModel.create({
      userId,
      title,
      message,
      type: 'order',
      actionUrl: `/orders/${orderId}`,
      data: { orderId },
    });
  }

  // Create notification for payment
  async createPaymentNotification(userId: string, orderId: string, title: string, message: string) {
    return this.notificationModel.create({
      userId,
      title,
      message,
      type: 'payment',
      actionUrl: `/orders/${orderId}`,
      data: { orderId },
    });
  }

  // Create notification for driver invitation
  async createInvitationNotification(userId: string, invitationId: string, companyName: string) {
    return this.notificationModel.create({
      userId,
      title: 'Driver Invitation',
      message: `You have been invited to join ${companyName}`,
      type: 'invitation',
      actionUrl: `/invitations/${invitationId}`,
      data: { invitationId, companyName },
    });
  }

  // ============= PUSH TOKEN METHODS =============

  /**
   * Register a push notification token for a user
   */
  async registerPushToken(
    userId: string,
    dto: RegisterPushTokenDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Registering push token for user ${userId}`);

      // Check if token already exists for this user
      const pushToken = await this.pushTokenModel.findOne({
        where: {
          userId,
          token: dto.token,
        },
      });

      if (pushToken) {
        // Update existing token
        await pushToken.update({
          deviceType: dto.deviceType,
          isActive: true,
        });

        this.logger.log(`Updated existing push token for user ${userId}`);
      } else {
        // Deactivate old tokens for this user (optional - keeps only latest token)
        await this.pushTokenModel.update(
          { isActive: false },
          { where: { userId, isActive: true } },
        );

        // Create new token
        await this.pushTokenModel.create({
          userId,
          token: dto.token,
          deviceType: dto.deviceType,
          isActive: true,
        });

        this.logger.log(`Created new push token for user ${userId}`);
      }

      return {
        success: true,
        message: 'Push token registered successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to register push token for user ${userId}:`, error.stack);
      throw error;
    }
  }

  /**
   * Unregister push token (for logout)
   */
  async unregisterPushToken(
    userId: string,
    token?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (token) {
        // Deactivate specific token
        await this.pushTokenModel.update({ isActive: false }, { where: { userId, token } });
      } else {
        // Deactivate all tokens for user
        await this.pushTokenModel.update({ isActive: false }, { where: { userId } });
      }

      this.logger.log(`Unregistered push token for user ${userId}`);

      return {
        success: true,
        message: 'Push token unregistered successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to unregister push token for user ${userId}:`, error.stack);
      throw error;
    }
  }

  /**
   * Get active push tokens for a user
   */
  async getActivePushTokens(userId: string): Promise<PushToken[]> {
    return this.pushTokenModel.findAll({
      where: {
        userId,
        isActive: true,
      },
      order: [['updatedAt', 'DESC']],
    });
  }

  /**
   * Get active push tokens for multiple users (for bulk notifications)
   */
  async getActivePushTokensForUsers(userIds: string[]): Promise<PushToken[]> {
    return this.pushTokenModel.findAll({
      where: {
        userId: { [Op.in]: userIds },
        isActive: true,
      },
    });
  }

  /**
   * Send push notification to a user
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const tokens = await this.getActivePushTokens(userId);

    if (tokens.length === 0) {
      this.logger.warn(`No active push tokens for user ${userId}`);
      return;
    }

    const messages = tokens.map((token) => ({
      to: token.token,
      sound: 'default',
      title,
      body,
      data,
    }));

    try {
      // Send to Expo Push API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('Failed to send push notification', errorText);
      } else {
        this.logger.log(`Sent push notification to user ${userId}`);
      }
    } catch (error) {
      this.logger.error('Error sending push notification:', error);
    }
  }
}
