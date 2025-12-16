import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { OrderItemsService } from "./order_items.service";

@Controller("orderItems")
@ApiTags("orderItems")
export class OrderItemsController {
  constructor(private readonly orderService: OrderItemsService) {}
}
