import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiProperty({ 
    description: 'Transaction reference or ID', 
    example: 'TXN_123456789' 
  })
  @IsString()
  transaction: string;

  @ApiPropertyOptional({ 
    description: 'Amount to refund in kobo (leave empty for full refund)', 
    example: 100000 
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ 
    description: 'Currency code', 
    example: 'NGN' 
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ 
    description: 'Customer note', 
    example: 'Refund for cancelled order' 
  })
  @IsString()
  @IsOptional()
  customerNote?: string;

  @ApiPropertyOptional({ 
    description: 'Merchant note', 
    example: 'Item out of stock' 
  })
  @IsString()
  @IsOptional()
  merchantNote?: string;
}