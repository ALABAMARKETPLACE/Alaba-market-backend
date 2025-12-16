import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Observable } from "rxjs";
import { AuthGuard } from "../shared/guards/auth.guard";
import { CreateOrderType } from "./dto/createOrder.dto";
import { GetOrderDetails } from "./dto/getOrderDetails.dto";
import { PaymentGateWayService } from "./payment_gateway.service";
import { CreateRefundDto } from "./dto/refund.dto";

@Controller("payment_gateway")
@ApiTags("payment_gateway")
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGateWayService) {}

  @UseGuards(AuthGuard)
  @Get("token")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [String] })
  createToken(): Promise<Observable<any>> {
    return this.paymentGatewayService.createtoken();
  }

  @UseGuards(AuthGuard)
  @Post("order")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [String] })
  createOrder(@Body() data: CreateOrderType): Promise<any> {
    return this.paymentGatewayService.createOrder(data);
  }

  @UseGuards(AuthGuard)
  @Post("details")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [String] })
  details(@Body() data: GetOrderDetails): Promise<any> {
    return this.paymentGatewayService.orderDetails(data);
  }

  @Post("refund")
  @ApiOkResponse({ description: "Refund processed successfully" })
  refund(@Body() data: CreateRefundDto): Promise<any> {
    return this.paymentGatewayService.processRefund(data);
  }
}
