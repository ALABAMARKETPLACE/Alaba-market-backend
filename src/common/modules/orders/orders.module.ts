// src/modules/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order-entity';
import { Product } from '../products/entities/products-entity';
import { DeliveryCompany } from '../delivery/entities/delivery-compnay-entity';
import { User } from '../users/entities/user-entity';
import { Driver } from '../drivers/entities/driver.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Order, Product, DeliveryCompany, User, Driver]),
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
