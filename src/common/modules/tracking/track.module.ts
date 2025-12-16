// src/tracking/tracking.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { Tracking } from './entities/delivery-log.entity';
import { DriverLocation } from './entities/driver-location.entity';

@Module({
  imports: [SequelizeModule.forFeature([Tracking, DriverLocation])],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
