import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PaystackVerifyDto {
  @ApiProperty({ description: 'Payment reference to verify' })
  @IsString()
  @IsNotEmpty()
  reference: string;
}

export class PaystackCustomer {
  @ApiProperty()
  id: number;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  customer_code: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  metadata: any;

  @ApiProperty()
  risk_action: string;
}

export class PaystackAuthorization {
  @ApiProperty()
  authorization_code: string;

  @ApiProperty()
  bin: string;

  @ApiProperty()
  last4: string;

  @ApiProperty()
  exp_month: string;

  @ApiProperty()
  exp_year: string;

  @ApiProperty()
  channel: string;

  @ApiProperty()
  card_type: string;

  @ApiProperty()
  bank: string;

  @ApiProperty()
  country_code: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  reusable: boolean;

  @ApiProperty()
  signature: string;

  @ApiProperty()
  account_name: string;
}

export class PaystackVerificationData {
  @ApiProperty()
  id: number;

  @ApiProperty()
  domain: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  gateway_response: string;

  @ApiProperty()
  paid_at: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  channel: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  ip_address: string;

  @ApiProperty()
  metadata: any;

  @ApiProperty()
  fees: number;

  @ApiProperty()
  customer: PaystackCustomer;

  @ApiProperty()
  authorization: PaystackAuthorization;

  @ApiProperty()
  plan: any;
}

export class PaystackVerificationResponseDto {
  @ApiProperty()
  status: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: PaystackVerificationData;
}