// src/modules/delivery-company/delivery-company.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DeliveryCompanyController } from './delivery-company.controller';
import { DeliveryCompanyService } from './delivery-company.service';
import { DeliveryCompany } from '../delivery/entities/delivery-compnay-entity';
import { User } from '../users/entities/user-entity';
import { Order } from '../orders/entities/order-entity';
import { Driver } from '../drivers/entities/driver.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([DeliveryCompany, User, Order, Driver]),
  ],
  controllers: [DeliveryCompanyController],
  providers: [DeliveryCompanyService],
  exports: [DeliveryCompanyService],
})
export class DeliveryCompanyModule {}
