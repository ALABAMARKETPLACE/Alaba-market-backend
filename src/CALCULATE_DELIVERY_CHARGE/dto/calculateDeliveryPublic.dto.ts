import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

// Guest cart item - simplified, no userId required
export class GuestCartItemDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  weight: number;

  @ApiProperty()
  @IsNumber()
  totalPrice: number;

  @ApiProperty()
  @IsNumber()
  storeId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  productId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  variantId?: number;
}

// Guest address - different from authenticated user address
export class GuestAddressDto {
  @ApiProperty()
  @IsString()
  id: string; // e.g., "guest_1707580800000"

  @ApiProperty()
  @IsString()
  full_name: string;

  @ApiProperty()
  @IsString()
  phone_no: string;

  @ApiProperty()
  @IsString()
  full_address: string;

  @ApiProperty()
  @IsNumber()
  country_id: number;

  @ApiProperty()
  @IsNumber()
  state_id: number;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsBoolean()
  is_guest: boolean;

  // Optional lat/long for distance-based calculation
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  long?: number;
}

// Public delivery calculation request
export class CalculateDeliveryPublicDto {
  @ApiProperty({ type: [GuestCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  cart: GuestCartItemDto[];

  @ApiProperty({ type: GuestAddressDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => GuestAddressDto)
  address: GuestAddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  total?: number;
}
