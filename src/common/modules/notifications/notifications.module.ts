import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { PushToken } from './entities/push-token.entity';
import { TestController } from './test.controller';

@Module({
  imports: [SequelizeModule.forFeature([Notification, PushToken])],
  controllers: [NotificationsController, TestController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
