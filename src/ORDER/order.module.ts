import { Module } from "@nestjs/common";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { OrderProvider } from "./order.provider";
import { OrderItemsModule } from "../ORDER_ITEMS/order_items.module";
import { OrderPaymentsModule } from "../ORDER_PAYMENTS/order_payments.module";
import { OrderStatusModule } from "../ORDER_STATUS/order_status.module";
import { CartModule } from "../CART/cart.module";
import { EmailModule } from "../MAILS/Mails.module";
import { PaymentGatewayModule } from "../PAYMENT_GATEWAY/payment_gateway.module";
import { PaystackModule } from "../PAYSTACK_PAYMENT/paystack.module";
import { OrderLogModule } from "../ORDER_LOG/orderlog.module";
import { NotificationsModule } from "../NOTIFICATIONS/notifications.module";
import { OrderPlaceService } from "./order.place";
import { OrderLogService } from "./order.log";
import { GuestOrderService } from "./guest-order.service";
@Module({
  imports: [
    OrderItemsModule,
    OrderPaymentsModule,
    OrderStatusModule,
    EmailModule,
    CartModule,
    PaymentGatewayModule,
    PaystackModule,
    OrderLogModule,
    NotificationsModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    ...OrderProvider,
    OrderPlaceService,
    GuestOrderService,
    OrderLogService,
  ],
  exports: [OrderService],
})
export class OrderModule {}
