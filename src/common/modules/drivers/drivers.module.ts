// =====================================================
// FILE: backend/src/modules/drivers/drivers.module.ts
// =====================================================
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DriversController } from './drivers.controller';
import { DriversService } from './driver.service';
import { Driver } from './entities/driver.entity';
import { DriverInvitation } from './entities/driver-invitation.entity';
import { DeliveryCompany } from '../delivery/entities/delivery-compnay-entity';
import { Order } from '../orders/entities/order-entity';
import { User } from '../users/entities/user-entity';

@Module({
  imports: [
    SequelizeModule.forFeature([Driver, DriverInvitation, DeliveryCompany, Order, User]),
  ],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}