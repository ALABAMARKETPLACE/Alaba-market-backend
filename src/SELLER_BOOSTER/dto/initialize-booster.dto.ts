import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { SellerBoosterTier } from "../seller-booster.constants";

export class InitializeBoosterDto {
  @ApiProperty({
    enum: ["basic", "gold", "premium"],
    example: "gold",
  })
  @IsIn(["basic", "gold", "premium"])
  tier: SellerBoosterTier;

  @ApiProperty({
    description: "Selected product IDs for basic/gold plans. Ignored for premium.",
    example: [1, 2, 3],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  product_ids?: number[];

  @ApiProperty({
    description: "Booster duration in days.",
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  duration_days?: number;

  @ApiProperty({
    description: "Browser redirect URL after Paystack payment.",
    required: false,
  })
  @IsOptional()
  @IsString()
  callback_url?: string;
}
