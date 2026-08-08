import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
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
import { PalmPayService } from "./palmpay.service";
import { PalmPayVerifyDto } from "./dto/palmpay-verify.dto";
import { PalmPayGuestVerifyDto } from "./dto/palmpay-guest-verify.dto";
import { PalmPayWebhookDto } from "./dto/palmpay-webhook.dto";

@Controller("palmpay")
@ApiTags("PalmPay Payment")
export class PalmPayController {
  constructor(private readonly palmPayService: PalmPayService) {}

  @Post("initialize")
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Initialize a PalmPay Checkout transaction" })
  @ApiOkResponse({ type: PaystackInitializeResponseDto })
  initialize(@Body() data: PaystackInitializeDto) {
    return this.palmPayService.initializePayment(data);
  }

  @Post("initialize-checkout")
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Initialize PalmPay for an authenticated marketplace checkout",
  })
  @ApiOkResponse({ type: PaystackInitializeResponseDto })
  initializeCheckout(
    @UserId() userId: number,
    @Body() data: PaystackUserInitializeDto
  ) {
    return this.palmPayService.initializeAuthenticatedCheckout(userId, data);
  }

  @Post("initialize-guest")
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Initialize PalmPay for a guest marketplace checkout",
  })
  @ApiOkResponse({ type: PaystackInitializeResponseDto })
  initializeGuest(@Body() data: PaystackGuestInitializeDto) {
    return this.palmPayService.initializeGuestPayment(data);
  }

  @Post("verify")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Query and verify a PalmPay transaction" })
  verify(@Body() data: PalmPayVerifyDto) {
    return this.palmPayService.verifyPayment(data.reference);
  }

  @Get("verify")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: "reference", required: true })
  @ApiOperation({ summary: "Query a PalmPay transaction by reference" })
  verifyByReference(@Query("reference") reference: string) {
    return this.palmPayService.verifyPayment(reference);
  }

  @Post("verify-guest")
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Query a PalmPay guest transaction" })
  verifyGuest(@Body() data: PalmPayGuestVerifyDto) {
    return this.palmPayService.verifyGuestPayment(
      data.reference,
      data.guest_email
    );
  }

  @Post("webhook")
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: "Verify and process PalmPay payment notifications" })
  async webhook(
    @Body() data: PalmPayWebhookDto,
    @Res() response: Response
  ): Promise<void> {
    await this.palmPayService.processWebhook(data);
    response.status(HttpStatus.OK).type("text/plain").send("success");
  }
}
