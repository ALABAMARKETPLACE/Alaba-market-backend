import { Module } from "@nestjs/common";
import { NewDistanceChargeService } from "./newdistancecharge.service";
import { NewDistanceChargeProviders } from "./newdistancecharge.provider";
import { NewDistanceChargeController } from "./newdistancecharge.controller";

@Module({
  imports: [],
  controllers: [NewDistanceChargeController],
  providers: [NewDistanceChargeService, ...NewDistanceChargeProviders],
  exports: [NewDistanceChargeService],
})
export class NewDistanceChargeModule {}
