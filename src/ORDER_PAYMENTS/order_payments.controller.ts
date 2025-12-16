import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { OrderPaymentsService } from "./order_payments.service";
@Controller("payments")
@ApiTags("payments")
export class OrderPaymentsController {
  constructor(private readonly orderService: OrderPaymentsService) {}
}
