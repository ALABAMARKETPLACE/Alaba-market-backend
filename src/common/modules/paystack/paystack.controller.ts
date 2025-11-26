// src/modules/paystack/paystack.controller.ts
import { Controller, Post, Body, UseGuards, Get, Param, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaystackService } from './paystack.service';
import {  VerifyPaymentDto } from './dto/veriify-payment.dto';
import { InitializePaymentDto } from "./dto/initialize-payment.dto";
import { Public } from '../../decorators/public.decorator';

@ApiTags('Paystack')
@Controller('paystack')
export class PaystackController {
  constructor(private paystackService: PaystackService) {}

  @Post('initialize')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initialize payment' })
  initializePayment(@Body() dto: InitializePaymentDto) {
    return this.paystackService.initializePayment(dto);
  }

  @Post('verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify payment' })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paystackService.verifyPayment(dto);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  handleWebhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    return this.paystackService.handleWebhook(payload, signature);
  }
}