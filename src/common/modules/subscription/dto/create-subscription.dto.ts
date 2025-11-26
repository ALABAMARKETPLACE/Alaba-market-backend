// backend/src/modules/subscription/dto/create-subscription.dto.ts
// import { IsUUID, IsString, IsOptional } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';
  // src/subscription/dto/create-subscription.dto.ts
import { IsUUID, IsEnum, IsNumber, IsString, IsDateString, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// export class CreateSubscriptionDto {
//   @ApiProperty()
//   @IsUUID()
//   companyId: string;

//   @ApiProperty()
//   @IsString()
//   paystackReference: string;
// }

// export class VerifySubscriptionDto {
//   @ApiProperty()
//   @IsString()
//   reference: string;

  



export class CreateSubscriptionDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  userId: string;

  @ApiProperty({ 
    description: 'Subscription plan type', 
    enum: ['basic', 'premium', 'enterprise'],
    example: 'premium'
  })
  @IsEnum(['basic', 'premium', 'enterprise'])
  planType: string;

  @ApiProperty({ description: 'Subscription amount', example: 5000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency', example: 'NGN' })
  @IsString()
  currency: string;

  @ApiProperty({ 
    description: 'Billing cycle', 
    enum: ['monthly', 'quarterly', 'yearly'],
    example: 'monthly'
  })
  @IsEnum(['monthly', 'quarterly', 'yearly'])
  billingCycle: string;

  @ApiProperty({ description: 'Subscription start date', example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Subscription end date', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Next billing date', example: '2024-02-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  nextBillingDate?: string;

  @ApiPropertyOptional({ description: 'Paystack subscription code' })
  @IsString()
  @IsOptional()
  paystackSubscriptionCode?: string;

  @ApiPropertyOptional({ description: 'Paystack customer code' })
  @IsString()
  @IsOptional()
  paystackCustomerCode?: string;

  @ApiPropertyOptional({ description: 'Auto-renew subscription', example: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({ 
    description: 'Subscription features',
    example: { maxOrders: 100, prioritySupport: true }
  })
  @IsObject()
  @IsOptional()
  features?: object;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}