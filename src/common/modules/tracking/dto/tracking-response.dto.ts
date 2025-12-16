import { ApiProperty } from '@nestjs/swagger';

export class DriverLocationResponseDto {
  @ApiProperty()
  driverId: string;

  @ApiProperty()
  driverName: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty({ required: false })
  accuracy?: number;

  @ApiProperty({ required: false })
  heading?: number;

  @ApiProperty({ required: false })
  speed?: number;

  @ApiProperty()
  lastUpdated: string;
}

export class OrderTrackingResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  status: string;

  @ApiProperty({
    type: 'object',
    properties: {
      latitude: { type: 'number' },
      longitude: { type: 'number' },
      address: { type: 'string' },
    },
  })
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      latitude: { type: 'number' },
      longitude: { type: 'number' },
      address: { type: 'string' },
    },
  })
  deliveryLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };

  @ApiProperty({ required: false })
  assignedDriver?: {
    id: string;
    name: string;
    phone: string;
    rating?: number;
  };

  @ApiProperty({ required: false })
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };

  @ApiProperty({ required: false })
  estimatedPickupTime?: string;

  @ApiProperty({ required: false })
  estimatedDeliveryTime?: string;

  @ApiProperty({ required: false })
  actualPickupTime?: string;

  @ApiProperty({ required: false })
  actualDeliveryTime?: string;

  @ApiProperty({ required: false })
  distanceRemaining?: number;

  @ApiProperty({ required: false })
  timeRemaining?: number;

  @ApiProperty({ required: false, type: [Object] })
  route?: Array<{
    latitude: number;
    longitude: number;
  }>;
}

export class DeliveryRouteResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        type: { type: 'string', enum: ['pickup', 'delivery'] },
        address: { type: 'string' },
      },
    },
  })
  waypoints: Array<{
    latitude: number;
    longitude: number;
    type: 'pickup' | 'delivery';
    address: string;
  }>;

  @ApiProperty({ description: 'Estimated duration in minutes' })
  estimatedDuration: number;

  @ApiProperty({ description: 'Estimated distance in km' })
  estimatedDistance: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
      },
    },
  })
  route: Array<{
    latitude: number;
    longitude: number;
  }>;
}
