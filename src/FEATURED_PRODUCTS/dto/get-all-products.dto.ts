import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsOptional,
  IsInt,
  IsString,
  IsBoolean,
  IsIn,
} from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class GetAllProductsDto extends PageOptionsDto {

  @ApiPropertyOptional({
    description: "Search by product name, sku, or brand",
    example: "laptop",
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    description: "Filter by category ID",
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  readonly category?: number;

  @ApiPropertyOptional({
    description: "Filter by subcategory ID",
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  readonly subCategory?: number;

  @ApiPropertyOptional({
    description: "Filter by store/seller ID",
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  readonly store_id?: number;

  @ApiPropertyOptional({
    description: "Filter by status (true=available, false=unavailable)",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  readonly status?: boolean;

  @ApiPropertyOptional({
    description: "Minimum price",
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  readonly min_price?: number;

  @ApiPropertyOptional({
    description: "Maximum price",
    example: 50000,
  })
  @IsOptional()
  @Type(() => Number)
  readonly max_price?: number;

  @ApiPropertyOptional({
    description: "Filter by stock status",
    example: "instock",
    enum: ["instock", "out_of_stock"],
  })
  @IsOptional()
  @IsString()
  @IsIn(["instock", "out_of_stock"])
  readonly stock_status?: "instock" | "out_of_stock";
}
