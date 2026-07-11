import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateBoosterPlanConfigDto {
  @ApiProperty({ example: "starter" })
  @IsString()
  name: string;

  @ApiProperty({ example: "Starter" })
  @IsString()
  display_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  product_limit?: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  boost_score: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(1)
  duration_days: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: "NGN" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_unlimited?: boolean;
}
