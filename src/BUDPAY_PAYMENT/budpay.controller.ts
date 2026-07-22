import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { SkipThrottle, Throttle } from "@nestjs/throttler";

import { AuthGuard } from "../shared/guards/auth.guard";
import { Public } from "../shared/decorator/optional.decorator";
import { UserId } from "../shared/decorator/userId_decorator";
import {
  PaystackInitializeDto,
  PaystackInitializeResponseDto,
} from "../PAYSTACK_PAYMENT/dto/paystack-initialize.dto";
import { PaystackUserInitializeDto } from "../PAYSTACK_PAYMENT/dto/paystack-user-initialize.dto";
import { PaystackGuestInitializeDto } from "../PAYSTACK_PAYMENT/dto/paystack-guest-initialize.dto";
import { BudPayService } from "./budpay.service";
import { BudPayVerifyDto } from "./dto/budpay-verify.dto";
import { BudPayGuestVerifyDto } from "./dto/budpay-guest-verify.dto";
import { BudPayWebhookDto } from "./dto/budpay-webhook.dto";

@Controller("budpay")
@ApiTags("BudPay Payment")
export class BudPayController {
  constructor(private readonly budPayService: BudPayService) {}

  private normalizeUserInitializeData(
    data: PaystackUserInitializeDto & Record<string, any>,
  ): PaystackUserInitializeDto {
    if (data?.order_payload || !data?.cart) {
      return data;
    }

    return {
      ...data,
      callback_url: data.callback_url || data.payment?.callback_url,
      order_payload: {
        cart: data.cart,
        payment: data.payment,
        address: data.address,
        charges: data.charges,
      },
    };
  }

  @Post("initialize")
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Initialize a BudPay Standard transaction" })
  @ApiOkResponse({ type: PaystackInitializeResponseDto })
  initialize(@Body() data: PaystackInitializeDto) {
    return this.budPayService.initializePayment(data);
  }

  @Post("initialize-checkout")
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Initialize BudPay for an authenticated checkout using the Paystack-compatible payload",
    description:
      "**charges.token** must come from a fresh call to `POST /calculate_delivery/new` (expires in 20 min).",
  })
  @ApiOkResponse({ type: PaystackInitializeResponseDto })
  @ApiBody({
    type: PaystackUserInitializeDto,
    examples: {
      budpay: {
        summary: "BudPay checkout",
        value: {
          payment_provider: "budpay",
          callback_url: "https://dev.alabamarketplace.ng/checkoutsuccess/2",
          order_payload: {
            cart: [
              {
                id: 323,
                productId: 13199,
                variantId: null,
                storeId: 4831,
                quantity: 1,
              },
            ],
            payment: {
              type: "budpay",
              callback_url:
                "https://dev.alabamarketplace.ng/checkoutsuccess/2",
            },
            address: { id: 171 },
            charges: {
              token: "<token from POST /calculate_delivery/new>",
            },
          },
        },
      },
    },
  })
  initializeCheckout(
    @UserId() userId: number,
    @Body() data: PaystackUserInitializeDto,
  ) {
    return this.budPayService.initializeAuthenticatedCheckout(
      userId,
      this.normalizeUserInitializeData(data),
    );
  }

  @Post("initialize-guest")
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Initialize BudPay guest checkout using the Paystack-compatible payload",
    description:
      "**amount** and **delivery_charge** are in kobo (₦ × 100).\n\n" +
      "**delivery_token** inside `order_payload.delivery` must come from a fresh call to `POST /calculate_delivery/public` (expires in 20 min).\n\n" +
      "The `callback_url` must be a real HTTPS URL — localhost URLs are automatically overridden.",
  })
  @ApiOkResponse({ type: PaystackInitializeResponseDto })
  @ApiBody({
    type: PaystackGuestInitializeDto,
    examples: {
      budpay: {
        summary: "BudPay — single product",
        value: {
          payment_provider: "budpay",
          guest_info: {
            email: "buyer@example.com",
            first_name: "Sunday",
            last_name: "Ibiam",
            phone: "07066026820",
            country_code: "+234",
          },
          cart_items: [
            {
              product_id: 8068,
              store_id: 3030,
              variant_id: null,
              quantity: 1,
              unit_price: 3500,
            },
          ],
          amount: 350000,
          delivery_charge: 0,
          currency: "NGN",
          callback_url: "https://dev.alabamarketplace.ng/checkoutsuccess/2",
          order_payload: {
            guest_info: {
              email: "buyer@example.com",
              first_name: "Sunday",
              last_name: "Ibiam",
              phone: "07066026820",
            },
            delivery_address: {
              full_name: "Sunday Ibiam",
              phone_no: "07066026820",
              full_address: "Igando Lagos",
              city: "Agege",
              state: "Lagos State Mainland E",
              state_id: 42,
              country: "Nigeria",
              country_id: 1,
            },
            cart_items: [
              {
                product_id: 8068,
                store_id: 3030,
                quantity: 1,
                unit_price: 3500,
                total_price: 3500,
                product_name: "Track light cast 20w",
                weight: 1,
              },
            ],
            payment: {
              payment_method: "budpay",
              amount_paid: 3500,
              payment_status: "pending",
            },
            delivery: {
              delivery_token: "<token from POST /calculate_delivery/public>",
              delivery_charge: 0,
              total_weight: 1,
            },
            order_summary: {
              subtotal: 3500,
              delivery_fee: 0,
              tax: 0,
              discount: 0,
              total: 3500,
            },
          },
        },
      },
    },
  })
  initializeGuest(@Body() data: PaystackGuestInitializeDto) {
    return this.budPayService.initializeGuestPayment(data);
  }

  @Post("verify")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify a BudPay transaction" })
  verify(@Body() data: BudPayVerifyDto) {
    return this.budPayService.verifyPayment(data);
  }

  @Get("verify")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify a BudPay transaction by reference" })
  @ApiQuery({ name: "reference", required: true })
  verifyByReference(@Query("reference") reference: string) {
    return this.budPayService.verifyPaymentByReference(reference);
  }

  @Post("verify-guest")
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify a BudPay guest transaction" })
  verifyGuest(@Body() data: BudPayGuestVerifyDto) {
    return this.budPayService.verifyGuestPayment(
      data.reference,
      data.guest_email,
    );
  }

  @Post("webhook")
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Handle and server-verify BudPay webhooks" })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-budpay-signature") xBudPaySignature: string,
    @Headers("budpay-signature") budPaySignature: string,
    @Headers("signature") signature: string,
    @Body() data: BudPayWebhookDto,
  ) {
    const rawPayload = req.rawBody?.toString("utf8") || JSON.stringify(data);
    return this.budPayService.processWebhook(
      data,
      xBudPaySignature || budPaySignature || signature,
      rawPayload,
    );
  }

  @Get("public-key")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get the BudPay public key when configured" })
  getPublicKey() {
    return { publicKey: this.budPayService.getPublicKey() };
  }
}
