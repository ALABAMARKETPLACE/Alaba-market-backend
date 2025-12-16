import { Module } from "@nestjs/common";
import { CartModule } from "../CART/cart.module";
import { EmailModule } from "../MAILS/Mails.module";
import { NotificationsModule } from "../NOTIFICATIONS/notifications.module";
import { PaymentGatewayModule } from "../PAYMENT_GATEWAY/payment_gateway.module";
import { PrintController } from "./print.controller";
import { PrintLogService } from "./print.log";
import { PrintPlaceService } from "./print.place";
import { PrintProvider } from "./print.provider";
import { PrintService } from "./print.service";
import { PrintItemsModule } from "../PRINT_ITEMS/print_items.module";
import { OrderStatusModule } from "../ORDER_STATUS/order_status.module";
import { OrderLogModule } from "../ORDER_LOG/orderlog.module";
import { PrintStatusModule } from "../PRINT_STATUS/print_status.module";

@Module({
  imports: [
    PrintItemsModule,
    OrderStatusModule,
    EmailModule,
    CartModule,
    PaymentGatewayModule,
    NotificationsModule,  
    OrderLogModule,
    PrintStatusModule
  ],
  controllers: [PrintController],
  providers: [
    PrintService,
    ...PrintProvider,
    PrintPlaceService,
    PrintLogService,
  ],
  exports: [PrintService],
})
export class PrintModule {}
