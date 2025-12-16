import { Module } from "@nestjs/common";
import { OrderPaymentsProvider } from "./order_payments.provider";
import { OrderPaymentsService } from "./order_payments.service";
import { PaymentGatewayModule } from "../PAYMENT_GATEWAY/payment_gateway.module";
@Module({
  imports: [PaymentGatewayModule],
  controllers: [],
  providers: [OrderPaymentsService, ...OrderPaymentsProvider],
  exports: [OrderPaymentsService],
})
export class OrderPaymentsModule {}
