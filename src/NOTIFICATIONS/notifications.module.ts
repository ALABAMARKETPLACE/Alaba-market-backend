import { Module } from "@nestjs/common";
import { NotificationsService } from "./notification.service";
import { NotificationsProvider } from "./notification.provider";
import { NotificationsController } from "./notification.controller";

@Module({
  imports: [],
  providers: [NotificationsService, NotificationsProvider],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
