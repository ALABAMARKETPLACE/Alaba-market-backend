import { IsUUID, IsOptional, IsEnum, IsString, IsNumber, IsArray, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeliveryLogDto {
  @ApiProperty({ description: 'Delivery ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  deliveryId: string;

  @ApiPropertyOptional({ description: 'Order ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Driver ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  @IsOptional()
  driverId?: string;

  @ApiProperty({ 
    description: 'Delivery status', 
    enum: ['created', 'assigned', 'accepted', 'rejected', 'picked_up', 'in_transit', 'arrived', 'delivered', 'failed', 'cancelled', 'returned'],
    example: 'picked_up'
  })
  @IsEnum(['created', 'assigned', 'accepted', 'rejected', 'picked_up', 'in_transit', 'arrived', 'delivered', 'failed', 'cancelled', 'returned'])
  status: string;

  @ApiPropertyOptional({ 
    description: 'Action type', 
    enum: ['status_change', 'location_update', 'driver_assignment', 'note_added', 'issue_reported', 'photo_uploaded', 'signature_captured', 'payment_collected', 'other'],
    example: 'status_change'
  })
  @IsEnum(['status_change', 'location_update', 'driver_assignment', 'note_added', 'issue_reported', 'photo_uploaded', 'signature_captured', 'payment_collected', 'other'])
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ description: 'Log description', example: 'Package picked up from warehouse' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Customer requested contactless delivery' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Latitude', example: 6.5244 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: 3.3792 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Address', example: 'Alaba International Market, Lagos' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'User ID who performed the action', example: '123e4567-e89b-12d3-a456-426614174003' })
  @IsUUID()
  @IsOptional()
  performedBy?: string;

  @ApiPropertyOptional({ 
    description: 'Type of user who performed the action', 
    enum: ['system', 'driver', 'customer', 'admin', 'automated'],
    example: 'driver'
  })
  @IsEnum(['system', 'driver', 'customer', 'admin', 'automated'])
  @IsOptional()
  performedByType?: string;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { temperature: '25C', humidity: '60%' }
  })
  @IsObject()
  @IsOptional()
  metadata?: object;

  @ApiPropertyOptional({ 
    description: 'Attachment URLs',
    example: ['https://s3.amazonaws.com/proof-of-delivery.jpg']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({ description: 'IP address', example: '192.168.1.1' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent', example: 'Mozilla/5.0...' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Estimated time in minutes', example: 30 })
  @IsNumber()
  @IsOptional()
  estimatedTime?: number;

  @ApiPropertyOptional({ description: 'Actual time in minutes', example: 35 })
  @IsNumber()
  @IsOptional()
  actualTime?: number;

  @ApiPropertyOptional({ description: 'Timestamp of the action', example: '2024-12-25T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  timestamp?: string;
}