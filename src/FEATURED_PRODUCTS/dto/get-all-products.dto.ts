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

  /**
   * ⚠️ NOTE:
   * Product status is FORCE-FILTERED in the service (status = true).
   * This field exists only for backward compatibility.
   */
  @ApiPropertyOptional({
    description: "Product status (ignored – only active products are returned)",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  readonly status?: boolean;

  @ApiPropertyOptional({
    description: "Minimum product price",
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  readonly min_price?: number;

  @ApiPropertyOptional({
    description: "Maximum product price",
    example: 50000,
  })
  @IsOptional()
  @Type(() => Number)
  readonly max_price?: number;

  @ApiPropertyOptional({
    description: "Stock availability filter",
    enum: ["instock", "out_of_stock"],
    example: "instock",
  })
  @IsOptional()
  @IsIn(["instock", "out_of_stock"])
  readonly stock_status?: "instock" | "out_of_stock";
}
