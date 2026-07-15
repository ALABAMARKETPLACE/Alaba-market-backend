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
  })
  @ApiOkResponse({ type: PaystackInitializeResponseDto })
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
  })
  @ApiOkResponse({ type: PaystackInitializeResponseDto })
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
