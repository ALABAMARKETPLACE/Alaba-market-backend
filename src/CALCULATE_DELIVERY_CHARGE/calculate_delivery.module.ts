import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { CalculateDeliveryChargeService } from "./calculate_delivery.service";
import { CalculateDeliveryController } from "./calculate_delivery.controller";
import { DistanceChargeModule } from "../DISTANCE_CHARGE/distancecharge.module";
import { DeliveryChargeModule } from "../DELIVERY_CHARGE/deliverycharge.module";

@Module({
  imports: [HttpModule, DistanceChargeModule, DeliveryChargeModule],
  controllers: [CalculateDeliveryController],
  providers: [CalculateDeliveryChargeService],
})
export class CalculateDeliveryChargeModule {}
