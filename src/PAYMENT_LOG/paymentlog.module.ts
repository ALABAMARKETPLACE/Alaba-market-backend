import { Module } from "@nestjs/common";
import { PaymentLogController } from "./paymentlog.controller";
import { PaymentLogService } from "./paymentlog.service";
import { PaymentLogProvider } from "./paymentlog.provider";
import { PaymentLogRepository } from "./paymentlog.repository";
  
@Module({
  imports: [],
  controllers: [PaymentLogController],
  providers: [PaymentLogService, ...PaymentLogProvider, PaymentLogRepository],
  exports: [PaymentLogService],
})
export class PaymentLogModule {}