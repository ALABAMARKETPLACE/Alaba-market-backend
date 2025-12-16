import { Module } from "@nestjs/common";
import { DistanceChargeController } from "./distancecharge.controller";
import { DistanceChargeService } from "./distancecharge.service";
import { DistanceChargeProvider } from "./distancecharge.provider";

@Module({
  imports: [],
  controllers: [DistanceChargeController],
  providers: [DistanceChargeService, ...DistanceChargeProvider],
  exports: [DistanceChargeService],
})
export class DistanceChargeModule {
}
