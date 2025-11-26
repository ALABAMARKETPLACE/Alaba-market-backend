// src/subscription/dto/subscription-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  planType: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  billingCycle: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  nextBillingDate: Date;

  @ApiProperty()
  paystackSubscriptionCode: string;

  @ApiProperty()
  paystackCustomerCode: string;

  @ApiProperty()
  autoRenew: boolean;

  @ApiProperty()
  features: object;

  @ApiProperty()
  notes: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
