import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty()
  status: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  };
}

export class VerifyPaymentResponseDto {
  @ApiProperty()
  status: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gatewayResponse: string;
    paidAt: string;
    createdAt: string;
    channel: string;
    currency: string;
    ipAddress: string;
    metadata: any;
    fees: number;
    customer: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      customerCode: string;
      phone: string;
      metadata: any;
      riskAction: string;
    };
    authorization: {
      authorizationCode: string;
      bin: string;
      last4: string;
      expMonth: string;
      expYear: string;
      channel: string;
      cardType: string;
      bank: string;
      countryCode: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}