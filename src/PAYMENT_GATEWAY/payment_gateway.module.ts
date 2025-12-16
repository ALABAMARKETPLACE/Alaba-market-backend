import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PaymentGatewayController } from "./payment_gateway.controller";
import { PaymentGateWayService } from "./payment_gateway.service";

@Module({
  imports: [HttpModule],
  controllers: [PaymentGatewayController],
  providers: [PaymentGateWayService],
  exports: [PaymentGateWayService],
})
export class PaymentGatewayModule {}
