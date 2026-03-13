import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PaymentTypeEnum } from "./payment-type.enum";

class PaymentDto {
  @ApiProperty({
    enum: PaymentTypeEnum,
    description:
      "Payment provider/type. Supported server-side checkout initialization currently exists for paystack.",
  })
  @IsEnum(PaymentTypeEnum)
  type: PaymentTypeEnum;

  @ApiProperty({
    required: false,
    description:
      "Existing transaction reference. Omit this when you want the backend to initialize checkout for supported gateways.",
  })
  @IsOptional()
  @IsString()
  ref?: string;

  @ApiProperty({
    required: false,
    description:
      "Browser redirect URL after payment. Used when the backend initializes hosted checkout for supported gateways.",
    example: "http://localhost:8000/paystack/success",
  })
  @IsOptional()
  @IsString()
  callback_url?: string;
}

class AddressRefDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;
}

class ChargesDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

class CartItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly id?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly productId: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly variantId?: number | null;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly storeId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  readonly cart: CartItem[];

  @ApiProperty({ type: PaymentDto })
  @ValidateNested()
  @Type(() => PaymentDto)
  readonly payment: paymentType;

  @ApiProperty({ type: AddressRefDto })
  @ValidateNested()
  @Type(() => AddressRefDto)
  readonly address: AddressType;

  @ApiProperty({ type: ChargesDto })
  @ValidateNested()
  @Type(() => ChargesDto)
  readonly charges: Charges;
}
export type CartItem = {
  readonly id?: number; //required.
  readonly productId: number;
  readonly variantId: number;
  readonly storeId: number;
  readonly quantity: number;
};

type paymentType = {
  ref?: string;
  type: PaymentTypeEnum;
  callback_url?: string;
};
export type AddressType = {
  readonly id: number;
};

export type gropedProducts = {
  storeId: number;
  products: CartItem[];
};
type Charges = {
  token: string;
};
