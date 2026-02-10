import { Controller, Post, Body, UseGuards, HttpCode } from "@nestjs/common";
import { CalculateDeliveryChargeService } from "./calculate_delivery.service";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CalculateDeliveryChargeDto } from "./dto/calculateDelivery.dto";
import { NewCalculateDeliveryDto } from "./dto/newCalculateDelivery.dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Public } from "src/shared/decorator/optional.decorator";
import { CalculateDeliveryPublicDto } from "./dto/calculateDeliveryPublic.dto";

@Controller("calculate_delivery")
@ApiTags("calculate_delivery")
export class CalculateDeliveryController {
  constructor(
    private readonly deliveryService: CalculateDeliveryChargeService,
  ) {}

  @UseGuards(AuthGuard)
  @Post("")
  @ApiBearerAuth()
  calculateDelivery(
    @Body() body: CalculateDeliveryChargeDto,
  ): Promise<DataResponseDto> {
    return this.deliveryService.getDeliveryCharge(body);
  }

  // New endpoint for weight-based delivery charge calculation
  @UseGuards(AuthGuard)
  @Post("new")
  @ApiBearerAuth()
  @ApiOkResponse({ type: DataResponseDto })
  @HttpCode(200)
  calculateNewDelivery(
    @Body() body: NewCalculateDeliveryDto,
  ): Promise<DataResponseDto> {
    return this.deliveryService.getNewDeliveryCharge(body);
  }

  // NEW: Public endpoint for guest checkout
  @Public()
  @Post("public")
  @ApiOkResponse({ type: DataResponseDto })
  @HttpCode(200)
  calculateDeliveryPublic(
    @Body() body: CalculateDeliveryPublicDto,
  ): Promise<DataResponseDto> {
    return this.deliveryService.getDeliveryChargePublic(body);
  }
}
