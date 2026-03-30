// dto/paystack-guest-initialize.dto.ts

import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/* =========================
   NESTED DTOs
========================= */

class GuestInfoDto {
  @ApiProperty({ description: "Guest email address" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "Guest first name" })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ description: "Guest last name" })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ description: "Guest phone number" })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

class CartItemDto {
  @ApiProperty({ description: "Product ID" })
  @IsNumber()
  product_id: number;

  @ApiProperty({ description: "Store ID" })
  @IsNumber()
  store_id: number;

  @ApiProperty({ description: "Quantity" })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: "Unit price in kobo" })
  @IsNumber()
  unit_price: number;
}

/* =========================
   MAIN REQUEST DTO
========================= */

export class PaystackGuestInitializeDto {
  @ApiProperty({
    description: "Guest information",
    type: GuestInfoDto,
  })
  @ValidateNested()
  @Type(() => GuestInfoDto)
  guest_info: GuestInfoDto;

  @ApiProperty({
    description: "Cart items",
    type: [CartItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  cart_items: CartItemDto[];

  @ApiProperty({ description: "Total cart amount in kobo (₦ × 100)" })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ description: "Delivery charge in kobo" })
  @IsNumber()
  @Min(0)
  delivery_charge: number;

  @ApiProperty({
    description: "Currency code",
    default: "NGN",
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: "Callback URL for payment completion",
    required: false,
  })
  @IsOptional()
  @IsString()
  callback_url?: string;

  @ApiProperty({
    description: "Additional metadata",
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
