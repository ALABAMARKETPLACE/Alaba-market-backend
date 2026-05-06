import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { SellerBoosterTier } from "../../SELLER_BOOSTER/seller-booster.constants";

export class CreateBoosterPlanConfigDto {
  @ApiProperty({ enum: ["basic", "gold", "premium"], example: "basic" })
  @IsIn(["basic", "gold", "premium"])
  name: SellerBoosterTier;

  @ApiProperty({ example: "Basic" })
  @IsString()
  display_name: string;

  @ApiPropertyOptional({ example: "Boost up to 5 selected products." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 5, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  @Type(() => Number)
  product_limit?: number | null;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  @Max(100000)
  @Type(() => Number)
  boost_score: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  @Max(3650)
  @Type(() => Number)
  duration_days: number;

  @ApiProperty({ example: 500000, description: "Amount in kobo." })
  @IsInt()
  @Min(100)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: "NGN", default: "NGN" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_unlimited?: boolean;
}
