// order.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
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
import { Order } from "./order.entity";
import { GuestCheckout } from "../PAYSTACK_PAYMENT/guest-checkout.entity";

@Module({
  imports: [
    SequelizeModule.forFeature([Order, GuestCheckout]),
    OrderItemsModule,
    OrderPaymentsModule,
    OrderStatusModule,
    EmailModule,
    CartModule,
    PaymentGatewayModule,
    forwardRef(() => PaystackModule),
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
  exports: [OrderService, GuestOrderService, OrderPlaceService],
})
export class OrderModule {}
