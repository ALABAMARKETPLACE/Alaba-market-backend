// src/payment/dto/initialize-payment.dto.ts
import { IsString, IsNumber, IsEmail, IsOptional, IsUUID, IsEnum, IsObject, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitializePaymentDto {
  @ApiProperty({ 
    description: 'Amount in kobo (for NGN) or smallest currency unit', 
    example: 500000,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ 
    description: 'Customer email address', 
    example: 'customer@example.com' 
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ 
    description: 'Currency code', 
    example: 'NGN',
    default: 'NGN'
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ 
    description: 'Transaction reference (auto-generated if not provided)', 
    example: 'TXN_123456789' 
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ 
    description: 'Callback URL after payment', 
    example: 'https://your-app.com/payment/callback' 
  })
  @IsString()
  @IsOptional()
  callbackUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Payment plan code', 
    example: 'PLN_xxxxxxxxxxxx' 
  })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiPropertyOptional({ 
    description: 'Payment channels to use', 
    example: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  channels?: string[];

  @ApiPropertyOptional({ 
    description: 'User ID making the payment', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ 
    description: 'Order ID for this payment', 
    example: '123e4567-e89b-12d3-a456-426614174001' 
  })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ 
    description: 'Subscription ID for recurring payments', 
    example: '123e4567-e89b-12d3-a456-426614174002' 
  })
  @IsUUID()
  @IsOptional()
  subscriptionId?: string;

  @ApiPropertyOptional({ 
    description: 'Payment type', 
    enum: ['order', 'subscription', 'wallet_topup', 'other'],
    example: 'order'
  })
  @IsEnum(['order', 'subscription', 'wallet_topup', 'other'])
  @IsOptional()
  paymentType?: string;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { orderId: '12345', customField: 'value' }
  })
  @IsObject()
  @IsOptional()
  metadata?: object;

  @ApiPropertyOptional({ 
    description: 'Customer first name', 
    example: 'John' 
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ 
    description: 'Customer last name', 
    example: 'Doe' 
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ 
    description: 'Customer phone number', 
    example: '+2348012345678' 
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Invoice number or description', 
    example: 'Payment for Order #12345' 
  })
  @IsString()
  @IsOptional()
  invoiceDescription?: string;

  @ApiPropertyOptional({ 
    description: 'Split payment code for subaccounts', 
    example: 'SPL_xxxxxxxxxxxx' 
  })
  @IsString()
  @IsOptional()
  splitCode?: string;

  @ApiPropertyOptional({ 
    description: 'Subaccount code', 
    example: 'ACCT_xxxxxxxxxxxx' 
  })
  @IsString()
  @IsOptional()
  subaccount?: string;

  @ApiPropertyOptional({ 
    description: 'Transaction charge bearer', 
    enum: ['account', 'subaccount'],
    example: 'account'
  })
  @IsEnum(['account', 'subaccount'])
  @IsOptional()
  bearer?: string;
}