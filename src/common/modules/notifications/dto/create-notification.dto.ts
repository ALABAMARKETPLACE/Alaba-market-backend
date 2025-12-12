import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsArray } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 'Order Update' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Your order is out for delivery' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    example: 'order',
    enum: ['order', 'driver', 'system', 'payment', 'invitation', 'alert'],
  })
  @IsNotEmpty()
  @IsEnum(['order', 'driver', 'system', 'payment', 'invitation', 'alert'])
  type: string;

  @ApiProperty({ example: ['user-id-1', 'user-id-2'], required: false })
  @IsOptional()
  @IsArray()
  recipientIds?: string[];

  @ApiProperty({ example: '/orders/123', required: false })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiProperty({ example: { orderId: '123', status: 'delivered' }, required: false })
  @IsOptional()
  data?: Record<string, any>;
}
