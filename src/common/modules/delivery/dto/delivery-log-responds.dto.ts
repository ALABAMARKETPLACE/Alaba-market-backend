import { ApiProperty } from '@nestjs/swagger';

export class DeliveryLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deliveryId: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  driverId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  notes: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  address: string;

  @ApiProperty()
  performedBy: string;

  @ApiProperty()
  performedByType: string;

  @ApiProperty()
  metadata: object;

  @ApiProperty()
  attachments: string[];

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  userAgent: string;

  @ApiProperty()
  estimatedTime: number;

  @ApiProperty()
  actualTime: number;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
