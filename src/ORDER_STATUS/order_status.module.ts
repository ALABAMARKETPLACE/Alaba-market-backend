import { Module } from "@nestjs/common";
import { OrderStatusService } from "./order_status.service";
import { OrderStatusProvider } from "./order_status.provider";
import { OrderStatusController } from "./order_status.controller";
@Module({
  imports: [],
  controllers: [OrderStatusController],
  providers: [OrderStatusService,...OrderStatusProvider],
  exports: [OrderStatusService],
})
export class OrderStatusModule {}
