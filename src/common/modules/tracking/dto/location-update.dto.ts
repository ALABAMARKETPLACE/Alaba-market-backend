import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator';

export class LocationUpdateDto {
  @ApiProperty({ description: 'Driver ID' })
  @IsNotEmpty()
  @IsUUID()
  driverId: string;

  @ApiProperty({ description: 'Order ID (optional)' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ description: 'Latitude', example: 6.5244 })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: 3.3792 })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ description: 'GPS accuracy in meters', required: false })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({ description: 'Heading/bearing in degrees', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiProperty({ description: 'Speed in m/s', required: false })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiProperty({ description: 'Address', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

export class StartTrackingDto {
  @ApiProperty({ description: 'Order ID to start tracking' })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Driver ID' })
  @IsNotEmpty()
  @IsUUID()
  driverId: string;
}

export class StopTrackingDto {
  @ApiProperty({ description: 'Order ID to stop tracking' })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;
}

export class RouteRequestDto {
  @ApiProperty({ description: 'Pickup latitude' })
  @IsNotEmpty()
  @IsNumber()
  pickupLat: number;

  @ApiProperty({ description: 'Pickup longitude' })
  @IsNotEmpty()
  @IsNumber()
  pickupLng: number;

  @ApiProperty({ description: 'Delivery latitude' })
  @IsNotEmpty()
  @IsNumber()
  deliveryLat: number;

  @ApiProperty({ description: 'Delivery longitude' })
  @IsNotEmpty()
  @IsNumber()
  deliveryLng: number;
}

export class MultiStopRouteDto {
  @ApiProperty({
    description: 'Array of waypoints',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        type: { type: 'string', enum: ['pickup', 'delivery'] },
      },
    },
  })
  @IsNotEmpty()
  waypoints: Array<{
    latitude: number;
    longitude: number;
    type: 'pickup' | 'delivery';
  }>;
}

export class DriverIdsDto {
  @ApiProperty({ description: 'Array of driver IDs', type: [String] })
  @IsNotEmpty()
  driverIds: string[];
}

export class OrderIdsDto {
  @ApiProperty({ description: 'Array of order IDs', type: [String] })
  @IsNotEmpty()
  orderIds: string[];
}
