// src/delivery/dto/assign-driver.dto.ts
import { IsUUID, IsOptional, IsString, IsNumber, IsDateString, IsObject, IsArray ,IsEnum, IsBoolean}   from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignDriverDto {
  @ApiProperty({ 
    description: 'Driver/Rider ID to assign', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsUUID()
  driverId: string;

  @ApiPropertyOptional({ 
    description: 'Order ID', 
    example: '123e4567-e89b-12d3-a456-426614174001' 
  })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ 
    description: 'Delivery ID', 
    example: '123e4567-e89b-12d3-a456-426614174002' 
  })
  @IsUUID()
  @IsOptional()
  deliveryId?: string;

  @ApiPropertyOptional({ 
    description: 'Estimated pickup time', 
    example: '2024-12-25T10:00:00Z' 
  })
  @IsDateString()
  @IsOptional()
  estimatedPickupTime?: string;

  @ApiPropertyOptional({ 
    description: 'Estimated delivery time', 
    example: '2024-12-25T12:00:00Z' 
  })
  @IsDateString()
  @IsOptional()
  estimatedDeliveryTime?: string;

  @ApiPropertyOptional({ 
    description: 'Priority level (1-5, 5 being highest)', 
    example: 3 
  })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ 
    description: 'Assignment notes', 
    example: 'Fragile items, handle with care' 
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Special instructions for driver', 
    example: 'Call customer 10 minutes before arrival' 
  })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional({ 
    description: 'Assignment metadata',
    example: { autoAssigned: true, reason: 'closest_driver' }
  })
  @IsObject()
  @IsOptional()
  metadata?: object;
}


export class UpdateAvailabilityDto {
  @ApiProperty({ 
    description: 'Driver availability status', 
    example: true 
  })
  @IsBoolean()
  isAvailable: boolean;

  @ApiPropertyOptional({ 
    description: 'Driver status', 
    enum: ['online', 'offline', 'busy', 'on_break', 'on_delivery'],
    example: 'online'
  })
  @IsEnum(['online', 'offline', 'busy', 'on_break', 'on_delivery'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Current latitude', 
    example: 6.5244 
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ 
    description: 'Current longitude', 
    example: 3.3792 
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ 
    description: 'Current address/location', 
    example: 'Alaba International Market, Lagos' 
  })
  @IsString()
  @IsOptional()
  currentLocation?: string;

  @ApiPropertyOptional({ 
    description: 'Maximum deliveries the driver can accept', 
    example: 5 
  })
  @IsNumber()
  @IsOptional()
  maxDeliveries?: number;

  @ApiPropertyOptional({ 
    description: 'Current number of active deliveries', 
    example: 2 
  })
  @IsNumber()
  @IsOptional()
  currentDeliveries?: number;

  @ApiPropertyOptional({ 
    description: 'Reason for status change', 
    example: 'Taking lunch break' 
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ 
    description: 'Notes about availability', 
    example: 'Available for urgent deliveries only' 
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Preferred delivery zones',
    example: ['Lagos Island', 'Victoria Island', 'Lekki']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredZones?: string[];

  @ApiPropertyOptional({ 
    description: 'Vehicle type',
    enum: ['bike', 'car', 'van', 'truck'],
    example: 'bike'
  })
  @IsEnum(['bike', 'car', 'van', 'truck'])
  @IsOptional()
  vehicleType?: string;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { batteryLevel: 85, fuelLevel: 'full' }
  })
  @IsObject()
  @IsOptional()
  metadata?: object;
}