import { createStructuredLogger } from "../shared/logger/structured-logger";
import { Controller, Post, Body, UseGuards, HttpCode } from "@nestjs/common";
import { CalculateDeliveryChargeService } from "./calculate_delivery.service";
import {
  ApiBearerAuth,
  ApiBody,
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
    summary: "Calculate weight-based delivery charge (authenticated)",
    description:
      "Returns a signed **delivery_token** (20 min TTL). Pass the token in `charges.token` when calling `POST /paystack/initialize-checkout` or `POST /budpay/initialize-checkout`.",
  })
  @ApiOkResponse({ type: DataResponseDto })
  @ApiBody({
    type: NewCalculateDeliveryDto,
    examples: {
      example: {
        summary: "Single item, Lagos",
        value: {
          cart: [{ weight: 1, quantity: 1 }],
          address: { id: 171, state_id: 42, country_id: 1 },
        },
      },
    },
  })
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
    summary: "Calculate delivery charge for guest checkout (no auth)",
    description:
      "Returns a signed **delivery_token** (20 min TTL). Pass the token in `order_payload.delivery.delivery_token` when calling `POST /paystack/initialize-guest` or `POST /budpay/initialize-guest`.\n\n" +
      "The `id` in the cart array must be the numeric **`id`** field from the product search response — never 0.",
  })
  @ApiOkResponse({ type: DataResponseDto })
  @ApiBody({
    type: CalculateDeliveryPublicDto,
    examples: {
      example: {
        summary: "Single item, Lagos guest",
        value: {
          cart: [
            {
              id: 8068,
              name: "Track light cast 20w",
              quantity: 1,
              weight: 1,
              totalPrice: 3500,
              storeId: 3030,
              productId: 8068,
            },
          ],
          address: {
            id: "guest_1784064622512",
            full_name: "Sunday Ibiam",
            phone_no: "07066026820",
            full_address: "Igando Lagos",
            country_id: 1,
            state_id: 42,
            country: "Nigeria",
            state: "Lagos State",
            is_guest: true,
          },
          total: 3500,
        },
      },
    },
  })
  @HttpCode(200)
  calculateDeliveryPublic(
    @Body() body: CalculateDeliveryPublicDto,
  ): Promise<DataResponseDto> {
    return this.deliveryService.getDeliveryChargePublic(body);
  }
}
