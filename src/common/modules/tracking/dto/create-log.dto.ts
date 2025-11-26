// src/tracking/dto/create-tracking.dto.ts
import { IsUUID, IsOptional, IsEnum, IsNumber, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTrackingDto {
  @ApiProperty({ description: 'Order ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ description: 'Rider ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsOptional()
  riderId?: string;

  @ApiProperty({ 
    description: 'Tracking status', 
    enum: ['pending', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    example: 'pending'
  })
  @IsEnum(['pending', 'picked_up', 'in_transit', 'delivered', 'cancelled'])
  status: string;

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

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Package at warehouse' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery time', example: '2024-12-25T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  estimatedDeliveryTime?: string;
}