// src/modules/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order-entity';
import { Product } from '../products/entities/products-entity';
import { DeliveryCompany } from '../delivery/entities/delivery-compnay-entity';
import { User } from '../users/entities/user-entity';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    SequelizeModule.forFeature([Order, Product, DeliveryCompany, User]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
