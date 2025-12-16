import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PaymentLogService } from "./paymentlog.service";
import { CreatePaymentLogDto } from "./dto/paymentlog.create.dto";
import { PaymentLogDto } from "./dto/paymentlog.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { AuthGuard } from "../shared/guards/auth.guard";
import { UserId } from "../shared/decorator/userId_decorator";

@Controller("paymentlog")
@ApiTags("paymentlog")
export class PaymentLogController {
  constructor(private readonly PaymentLogService: PaymentLogService) {}

  @UseGuards(AuthGuard)
  @Post()
  @ApiDataObjectResponse(PaymentLogDto)
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @UserId() userId: number,
    @Body() create: CreatePaymentLogDto
  ): Promise<DataResponseDto> {
    return this.PaymentLogService.create(userId, create);
  }
}
