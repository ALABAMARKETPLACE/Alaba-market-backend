// src/modules/orders/dto/create-order.dto.ts
import { IsString, IsNumber, IsUUID, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  deliveryCompanyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  selectedRoute?: string;

  @ApiProperty()
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deliveryCity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deliveryState?: string;
}

