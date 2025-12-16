import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";
import { OrderStatusDto } from "./dto/orderStatus.dto";
import { OrderStatusService } from "./order_status.service";

@Controller("orderStatus")
@ApiTags("orderStatus")
export class OrderStatusController {
  constructor(private readonly orderService: OrderStatusService) {}
  @Get("all/:id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [OrderStatusDto] })
  findAll(@Param("id", ParseIntPipe) id: number): any {
    return this.orderService.findAll(id);
  }
}
