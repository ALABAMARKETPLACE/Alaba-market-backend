// backend/src/modules/orders/dto/update-order.dto.ts
import { IsEnum, IsOptional, IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../../enums/order-status';

export class UpdateOrderDto {
  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ConfirmPackageReceivedDto {
  @ApiProperty()
  @IsString()
  barcodeShortCode: string;

  @ApiProperty()
  @IsString()
  packagePhoto: string;
}

export class ConfirmDeliveryDto {
  @ApiProperty()
  @IsString()
  deliveryCode: string;

  @ApiProperty()
  @IsString()
  deliveryPhoto: string;

  @ApiProperty()
  geolocation: {
    latitude: number;
    longitude: number;
  };
}
