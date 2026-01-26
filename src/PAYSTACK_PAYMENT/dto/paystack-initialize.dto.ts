import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

/* =========================
   REQUEST DTO
========================= */

export class PaystackInitializeDto {
  @ApiProperty({ description: "Customer email address" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "Amount in kobo (smallest currency unit)" })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({
    description: "Currency code",
    default: "NGN",
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: "Callback URL for payment completion" })
  @IsString()
  @IsNotEmpty()
  callback_url: string;

  @ApiProperty({
    description: "Reference for the transaction",
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({
    description: "Store/Seller ID for split payments",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  store_id?: number;

  @ApiProperty({
    description: "Order ID for split payments",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  order_id?: number;

  @ApiProperty({
    description: "Enable automatic split payment",
    required: false,
    default: false,
  })
  @IsOptional()
  split_payment?: boolean;

  @ApiProperty({
    description: "Additional metadata",
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/* =========================
   RESPONSE DTO (FINAL)
========================= */

class PaystackInitializeDataDto {
  @ApiProperty({
    example: "https://checkout.paystack.com/abcd1234",
  })
  authorization_url: string;

  @ApiProperty({
    example: "ACCESS_abc123",
  })
  access_code: string;

  @ApiProperty({
    example: "alaba_1700000000000_x9k2p",
  })
  reference: string;
}

export class PaystackInitializeResponseDto {
  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: "Payment initialized" })
  message: string;

  @ApiProperty({ type: PaystackInitializeDataDto })
  data: PaystackInitializeDataDto;
}
