import { Module } from "@nestjs/common";
import { OrderItemsProvider } from "./order_items.provider";
import { OrderItemsService } from "./order_items.service";

@Module({
  imports: [],
  controllers: [],
  providers: [OrderItemsService, ...OrderItemsProvider],
  exports: [OrderItemsService],
})
export class OrderItemsModule {}
