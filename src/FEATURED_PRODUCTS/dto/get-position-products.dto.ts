import { ApiPropertyOptional } from "@nestjs/swagger";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
import { IsOptional, IsString, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class GetPositionProductsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: "Search by product name or SKU",
    example: "laptop",
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    description: "Filter by store/seller ID",
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly store_id?: number;

  @ApiPropertyOptional({
    description: "Minimum price",
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  readonly min_price?: number;

  @ApiPropertyOptional({
    description: "Maximum price",
    example: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  readonly max_price?: number;

  @ApiPropertyOptional({
    description: "Product status (1 = active, 0 = inactive)",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly status?: number;

  @ApiPropertyOptional({
    description: "Number of items per page (defaults to 20)",
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly take?: number = 20;
}
