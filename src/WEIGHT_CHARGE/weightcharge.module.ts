import { Module } from "@nestjs/common";
import { WeightChargeController } from "./weightcharge.controller";
import { WeightChargeService } from "./weightcharge.service";
import { WeightChargeProvider } from "./weightcharge.provider";

@Module({
  imports: [],
  controllers: [WeightChargeController],
  providers: [WeightChargeService, ...WeightChargeProvider],
  exports: [WeightChargeService],
})
export class WeightChargeModule {
}
