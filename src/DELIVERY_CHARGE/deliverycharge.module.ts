import { Module } from "@nestjs/common";
import { DeliveryChargeController } from "./deliverycharge.controller";
import { DeliveryChargeService } from "./deliverycharge.service";
import { DeliveryChargeProvider } from "./deliverycharge.provider";

@Module({
  imports: [],
  controllers: [DeliveryChargeController],
  providers: [DeliveryChargeService, ...DeliveryChargeProvider],
  exports: [DeliveryChargeService],
})
export class DeliveryChargeModule {}
