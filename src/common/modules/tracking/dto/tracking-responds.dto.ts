import { ApiProperty } from '@nestjs/swagger';

export class TrackingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  riderId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  address: string;

  @ApiProperty()
  notes: string;

  @ApiProperty()
  estimatedDeliveryTime: Date;

  @ApiProperty()
  actualDeliveryTime: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}