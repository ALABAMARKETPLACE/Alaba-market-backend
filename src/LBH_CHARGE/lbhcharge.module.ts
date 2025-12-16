import { Module } from "@nestjs/common";
import { LbhChargeController } from "./lbhcharge.controller";
import { LbhChargeService } from "./lbhcharge.service";
import { LbhChargeProvider } from "./lbhcharge.provider";

@Module({
  imports: [],
  controllers: [LbhChargeController],
  providers: [LbhChargeService, ...LbhChargeProvider],
  exports: [LbhChargeService],
})
export class LbhChargeModule {
}
