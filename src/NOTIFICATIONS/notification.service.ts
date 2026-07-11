import { createStructuredLogger } from "../shared/logger/structured-logger";
// import {
//   Inject,
//   Injectable,
//   InternalServerErrorException,
// } from "@nestjs/common";
// import { NotificationsModal } from "./notification.entity";
// import { DataResponseDto } from "../shared/dto/data-response-dto";
// import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
// import { ConfigService } from "../shared/config/config.service";
// const FCM = require("fcm-node");

// @Injectable()
// export class NotificationsService {
//   private fcm: any;
//   constructor(
//     @Inject("NotificationsRepository")
//     private readonly repository: typeof NotificationsModal,
//     private configService: ConfigService
//   ) {
//     this.fcm = new FCM(this.configService.pushNotificationConfig);
//   }
//   async createNotification(
//     type: string,
//     message: string,
//     title: string,
//     typeId: number,
//     userId: number,
//     image: string = process.env.LOGO,
//     fcmtoken?: string
//   ) {
//     try {
//       const create = await this.repository.create({
//         type,
//         message,
//         title,
//         typeId,
//         userId,
//         image,
//       });
//       return create;
//     } catch (err) {
//       return null;
//     }
//   }
//   async findAll(userId: number, pageOptions: PageOptionsDto) {
//     const { take, offset } = pageOptions;
//     try {
//       const { rows, count } = await this.repository.findAndCountAll({
//         where: { userId },
//         offset,
//         limit: take,
//         order: [["createdAt", "DESC"]],
//         attributes: { exclude: ["updatedAt", "userId"] },
//       });
//       return new DataResponseDto(rows, pageOptions, count);
//     } catch (err) {
//       throw new InternalServerErrorException();
//     }
//   }
//   async Test(to: string) {
//     try {
//       const message = {
//         to,
//         data: {
//           title: "Hello from nextme",
//           body: "hello this is a test push notification",
//           sound: "tring.wav",
//         },
//       };
//       this.fcm?.send(message, function (err, response) {
//         if (err) {
//           appLog.info("Something has gone wrong!");
//         } else {
//           appLog.info("Successfully sent with response: ", response);
//         }
//       });
//     } catch (err) {
//       appLog.info(err);
//     }
//   }

//   async sendPushNotification(data: {
//     to: string;
//     title: string;
//     message: string;
//   }) {
//     try {
//       const message = {
//         to: data?.to,
//         data: {
//           title: data?.title,
//           body: data?.message,
//           sound: "tring.wav",
//         },
//       };
//       this.fcm?.send(message, function (err, response) {
//         if (err) {
//           appLog.info("Something has gone wrong!");
//         } else {
//           appLog.info("Successfully sent seller notification: ", response);
//         }
//       });
//     } catch (err) {}
//   }
// }

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { NotificationsModal } from "./notification.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { ConfigService } from "../shared/config/config.service";
import * as admin from "firebase-admin";

const appLog = createStructuredLogger("notification_service");

@Injectable()
export class NotificationsService {
  private messaging: admin.messaging.Messaging;

  constructor(
    @Inject("NotificationsRepository")
    private readonly repository: typeof NotificationsModal,
    private configService: ConfigService
  ) {
    this.messaging = admin.messaging();
  }

  async createNotification(
    type: string,
    message: string,
    title: string,
    typeId: number,
    userId: number,
    image: string = process.env.LOGO || "",
    fcmtoken?: string
  ): Promise<NotificationsModal | null> {
    try {
      return await this.repository.create({
        type,
        message,
        title,
        typeId,
        userId,
        image,
      });
    } catch (err) {
      appLog.error("Error creating notification:", err);
      return null;
    }
  }

  async findAll(
    userId: number,
    pageOptions: PageOptionsDto
  ): Promise<DataResponseDto> {
    const { take, offset } = pageOptions;
    try {
      appLog.info(`[NotificationService.findAll] Fetching notifications for user ${userId}`);
      const { rows, count } = await this.repository.findAndCountAll({
        where: { userId },
        offset,
        limit: take,
        order: [["createdAt", "DESC"]],
        attributes: { exclude: ["updatedAt", "userId"] },
      });
      appLog.info(`[NotificationService.findAll] Found ${count} notifications, returning ${rows.length} rows`);
      appLog.info(`[NotificationService.findAll] Unread count: ${rows.filter((n: any) => !n.is_read).length}`);
      return new DataResponseDto(rows, pageOptions, count);
    } catch (err) {
      appLog.error("Error fetching notifications:", err);
      throw new InternalServerErrorException("Error fetching notifications");
    }
  }

  async markAsRead(id: number, userId: number): Promise<DataResponseDto> {
    try {
      const notif = await this.repository.findOne({ where: { id, userId } });
      if (!notif) {
        return new DataResponseDto({}, false, "Notification not found");
      }
      
      appLog.info(`[NotificationService.markAsRead] Marking notification ${id} as read for user ${userId}`);
      notif.is_read = true;
      await notif.save();
      appLog.info(`[NotificationService.markAsRead] Successfully marked notification ${id} as read`);
      
      return new DataResponseDto({ id: notif.id }, true, "Marked as read");
    } catch (err) {
      appLog.error("Error marking notification as read:", err);
      throw new InternalServerErrorException("Error updating notification");
    }
  }

  async Test(to: string): Promise<void> {
    try {
      const message = {
        token: to,
        notification: {
          title: "Hello from Alaba Marketplace",
          body: "This is a test push notification",
        },
        android: {
          notification: {
            sound: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "tring.wav",
            },
          },
        },
      };
      const response = await this.messaging.send(message);
      appLog.info("Successfully sent test notification:", response);
    } catch (err) {
      appLog.error("Error sending test notification:", err);
    }
  }

  async sendPushNotification(data: {
    to: string;
    title: string;
    message: string;
  }): Promise<void> {
    try {
      const message = {
        token: data.to,
        notification: {
          title: data.title,
          body: data.message,
        },
        android: {
          notification: {
            sound: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "tring.wav",
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      appLog.info("Successfully sent push notification:", response);
    } catch (err) {
      appLog.error("Error sending push notification:", err);
    }
  }
}
