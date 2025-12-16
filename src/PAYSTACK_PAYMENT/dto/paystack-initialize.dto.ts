import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PaystackInitializeDto {
  @ApiProperty({ description: 'Customer email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Amount in kobo (smallest currency unit)' })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ description: 'Currency code', default: 'NGN', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Callback URL for payment completion' })
  @IsString()
  @IsNotEmpty()
  callback_url: string;

  @ApiProperty({ description: 'Reference for the transaction', required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ description: 'Store/Seller ID for split payments', required: false })
  @IsOptional()
  @IsNumber()
  store_id?: number;

  @ApiProperty({ description: 'Order ID for split payments', required: false })
  @IsOptional()
  @IsNumber()
  order_id?: number;

  @ApiProperty({ description: 'Enable automatic split payment (5% admin, 95% seller)', required: false, default: false })
  @IsOptional()
  split_payment?: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: {
    cancel_url?: string;
    custom_fields?: any[];
    [key: string]: any;
  };
}

export class PaystackInitializeResponseDto {
  @ApiProperty()
  status: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}