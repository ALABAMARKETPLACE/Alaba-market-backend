import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsIn, IsLatitude, IsLongitude, IsOptional } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
import { Order } from "../../shared/constants/constants";

export class ProductSearchSingleDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  readonly storeId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsLatitude()
  readonly lattitude?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsLongitude()
  readonly longitude?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100000, default: 5 })
  @Type(() => Number)
  @IsOptional()
  readonly radius?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    return value && value != "undefined" ? value : "";
  })
  readonly query: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  readonly category?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  readonly subCategory?: number;

  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  @IsIn(["top", "recent"])
  readonly tag?: string;

  @ApiPropertyOptional({ enum: Order, default: Order.ASC })
  @IsOptional()
  readonly price?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  readonly exclude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    return value == "1" || value == "true" ? true : false;
  })
  readonly instock: boolean = false;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["all", "active", "inactive", "out_of_stock", "instock"])
  readonly status: string;
}
