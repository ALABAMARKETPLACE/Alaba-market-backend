import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class BoostedCategoryDto {
  @ApiPropertyOptional({ description: "Category ID", example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly category?: number;

  @ApiPropertyOptional({ description: "Subcategory ID", example: 34 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly subCategory?: number;

  @ApiPropertyOptional({
    description: "Store ID (multi-store mode)",
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly store_id?: number;

  @ApiPropertyOptional({ description: "Search keyword" })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number = 1;

  @ApiPropertyOptional({ description: "Items per page", default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly take?: number = 10;

  @ApiPropertyOptional({ description: "Sorting order", default: "ASC" })
  @IsOptional()
  @IsString()
  readonly order?: string;

  @ApiPropertyOptional({ description: "Price sort order" })
  @IsOptional()
  @IsString()
  readonly price?: string;
}
