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
  IsIn,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { CreateGuestOrderDto } from "../../ORDER/dto/create-guest-order.dto";

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

  @ApiProperty({ description: "Variant ID, if this item is a product variant", required: false })
  @IsOptional()
  @IsNumber()
  variant_id?: number;

  @ApiProperty({ description: "Quantity" })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description:
      "Client-supplied unit price. Informational only — the backend recomputes the real price from the product/variant record and ignores this value when charging.",
  })
  @IsNumber()
  unit_price: number;
}

/* =========================
   MAIN REQUEST DTO
========================= */

export class PaystackGuestInitializeDto {
  @ApiProperty({
    description:
      "Optional payment provider selector. Missing values remain Paystack for backward compatibility.",
    enum: ["paystack", "budpay", "palmpay"],
    required: false,
  })
  @IsOptional()
  @IsIn(["paystack", "budpay", "palmpay"])
  payment_provider?: "paystack" | "budpay" | "palmpay";

  @ApiProperty({
    description: "Alias for payment_provider.",
    enum: ["paystack", "budpay", "palmpay"],
    required: false,
  })
  @IsOptional()
  @IsIn(["paystack", "budpay", "palmpay"])
  payment_channel?: "paystack" | "budpay" | "palmpay";

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
    description:
      "Browser redirect URL after payment.",
    example: "http://localhost:8000/paystack/success",
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

  @ApiProperty({
    description:
      "Optional full guest order payload. When provided, the selected provider webhook can finalize the guest order without waiting for frontend verification.",
    required: false,
    type: CreateGuestOrderDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateGuestOrderDto)
  order_payload?: CreateGuestOrderDto;
}
