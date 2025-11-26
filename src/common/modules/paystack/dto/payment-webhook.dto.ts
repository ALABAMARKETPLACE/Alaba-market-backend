import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentWebhookDto {
  @ApiProperty({ description: 'Event type', example: 'charge.success' })
  @IsString()
  event: string;

  @ApiProperty({ description: 'Event data' })
  @IsObject()
  data: any;

  @ApiPropertyOptional({ description: 'Webhook signature' })
  @IsString()
  @IsOptional()
  signature?: string;
}