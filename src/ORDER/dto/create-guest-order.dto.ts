import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from "class-validator";

// Guest Personal Info
export class GuestInfoDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional() // ✅ Changed to optional
  @IsString()
  @IsOptional()
  country_code?: string;
}

// Delivery Address
export class GuestDeliveryAddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone_no: string;

  @ApiPropertyOptional() // ✅ Changed to optional
  @IsString()
  @IsOptional()
  country_code?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  full_address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  state_id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  country_id: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address_type?: string;
}

// Cart Item
export class GuestCartItemDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @ApiPropertyOptional() // ✅ Changed to optional (products without variants)
  @IsNumber()
  @IsOptional()
  variant_id?: number;

  @ApiPropertyOptional() // ✅ Changed to optional (fetched from product)
  @IsNumber()
  @IsOptional()
  store_id?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  variant_name?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional() // ✅ Changed to optional (fetched from product)
  @IsNumber()
  @IsOptional()
  @Min(0)
  unit_price?: number;

  @ApiPropertyOptional() // ✅ Changed to optional (calculated)
  @IsNumber()
  @IsOptional()
  @Min(0)
  total_price?: number;

  @ApiPropertyOptional() // ✅ Changed to optional
  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;
}

// Payment Info
export class GuestPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  payment_reference: string;

  @ApiPropertyOptional() // ✅ Changed to optional
  @IsString()
  @IsOptional()
  payment_method?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transaction_reference: string;

  @ApiPropertyOptional() // ✅ Changed to optional
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount_paid?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  payment_status: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paid_at?: string;
}

// Delivery Info
export class GuestDeliveryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  delivery_token: string;

  @ApiPropertyOptional() // ✅ Changed to optional (from token)
  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_charge?: number;

  @ApiPropertyOptional() // ✅ Changed to optional (from token)
  @IsNumber()
  @IsOptional()
  @Min(0)
  total_weight?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimated_delivery_days?: number;
}

// Order Summary
export class OrderSummaryDto {
  @ApiPropertyOptional() // ✅ Changed to optional (calculated on backend)
  @IsNumber()
  @IsOptional()
  @Min(0)
  subtotal?: number;

  @ApiPropertyOptional() // ✅ Changed to optional
  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_fee?: number;

  @ApiPropertyOptional() // ✅ Changed to optional
  @IsNumber()
  @IsOptional()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional() // ✅ Changed to optional
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional() // ✅ Changed to optional
  @IsNumber()
  @IsOptional()
  @Min(0)
  total?: number;
}

// Metadata (Optional)
export class OrderMetadataDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  order_notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preferred_delivery_time?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  device_id?: string;
}

// Main Guest Order DTO
export class CreateGuestOrderDto {
  @ApiProperty({ type: GuestInfoDto })
  @ValidateNested()
  @Type(() => GuestInfoDto)
  @IsNotEmpty()
  guest_info: GuestInfoDto;

  @ApiProperty({ type: GuestDeliveryAddressDto })
  @ValidateNested()
  @Type(() => GuestDeliveryAddressDto)
  @IsNotEmpty()
  delivery_address: GuestDeliveryAddressDto;

  @ApiProperty({ type: [GuestCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  cart_items: GuestCartItemDto[];

  @ApiProperty({ type: GuestPaymentDto })
  @ValidateNested()
  @Type(() => GuestPaymentDto)
  @IsNotEmpty()
  payment: GuestPaymentDto;

  @ApiProperty({ type: GuestDeliveryDto })
  @ValidateNested()
  @Type(() => GuestDeliveryDto)
  @IsNotEmpty()
  delivery: GuestDeliveryDto;

  @ApiPropertyOptional({ type: OrderSummaryDto }) // ✅ Changed to optional
  @ValidateNested()
  @Type(() => OrderSummaryDto)
  @IsOptional()
  order_summary?: OrderSummaryDto;

  @ApiPropertyOptional({ type: OrderMetadataDto })
  @ValidateNested()
  @Type(() => OrderMetadataDto)
  @IsOptional()
  metadata?: OrderMetadataDto;
}
