import { createStructuredLogger } from "../shared/logger/structured-logger";
import { Controller, Post, Body, UseGuards, HttpCode } from "@nestjs/common";
import { CalculateDeliveryChargeService } from "./calculate_delivery.service";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CalculateDeliveryChargeDto } from "./dto/calculateDelivery.dto";
import { NewCalculateDeliveryDto } from "./dto/newCalculateDelivery.dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Public } from "../shared/decorator/optional.decorator";
import { CalculateDeliveryPublicDto } from "./dto/calculateDeliveryPublic.dto";

const appLog = createStructuredLogger("calculate_delivery_controller");

@Controller("calculate_delivery")
@ApiTags("calculate_delivery")
export class CalculateDeliveryController {
  constructor(
    private readonly deliveryService: CalculateDeliveryChargeService,
  ) {}

  @UseGuards(AuthGuard)
  @Post("")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Calculate authenticated delivery charge",
    description:
      "Temporary behavior: the legacy distance-based fee is disabled. This endpoint currently returns only the configured product/order-value delivery charge and still issues the delivery token required for checkout.",
  })
  @ApiOkResponse({ type: DataResponseDto })
  calculateDelivery(
    @Body() body: CalculateDeliveryChargeDto,
  ): Promise<DataResponseDto> {
    return this.deliveryService.getDeliveryCharge(body);
  }

  // New endpoint for weight-based delivery charge calculation
  @UseGuards(AuthGuard)
  @Post("new")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Calculate weight-based delivery charge",
    description:
      "Uses the newer weight and location configuration flow. This is separate from the legacy distance-based calculation.",
  })
  @ApiOkResponse({ type: DataResponseDto })
  @HttpCode(200)
  calculateNewDelivery(
    @Body() body: NewCalculateDeliveryDto,
  ): Promise<DataResponseDto> {
    appLog.debug(
      { event: "delivery_calculation_requested" },
      "delivery calculation requested",
    );
    return this.deliveryService.getNewDeliveryCharge(body);
  }

  // NEW: Public endpoint for guest checkout
  @Public()
  @Post("public")
  @ApiOperation({
    summary: "Calculate public delivery charge for guest checkout",
    description:
      "Uses the guest weight/state-country delivery flow and returns a guest delivery token for later guest checkout.",
  })
  @ApiOkResponse({ type: DataResponseDto })
  @HttpCode(200)
  calculateDeliveryPublic(
    @Body() body: CalculateDeliveryPublicDto,
  ): Promise<DataResponseDto> {
    return this.deliveryService.getDeliveryChargePublic(body);
  }
}
