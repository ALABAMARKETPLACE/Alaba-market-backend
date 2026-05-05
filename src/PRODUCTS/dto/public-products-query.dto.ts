import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsString } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class PublicProductsQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: "Search products by name, title, description, brand, or store name" })
  @IsString()
  @IsOptional()
  readonly search?: string;

  @ApiPropertyOptional({ description: "Filter by category ID" })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly categoryId?: number;

  @ApiPropertyOptional({ description: "Filter by sub-category ID" })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly subCategoryId?: number;

  @ApiPropertyOptional({ description: "Legacy alias for subCategoryId" })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly subCategory?: number;

  @ApiPropertyOptional({ description: "Filter by store ID" })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly storeId?: number;

  @ApiPropertyOptional({ description: "Filter by brand" })
  @IsString()
  @IsOptional()
  readonly brandId?: string;

  @ApiPropertyOptional({ description: "Minimum product price" })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  readonly minPrice?: number;

  @ApiPropertyOptional({ description: "Maximum product price" })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  readonly maxPrice?: number;

  @ApiPropertyOptional({
    enum: ["newest", "price_low", "price_high", "random"],
    default: "newest",
  })
  @IsIn(["newest", "price_low", "price_high", "random"])
  @IsOptional()
  readonly sort?: "newest" | "price_low" | "price_high" | "random";
}
