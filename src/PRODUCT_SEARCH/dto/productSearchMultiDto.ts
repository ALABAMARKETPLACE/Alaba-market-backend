import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  Max,
  Min,
} from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
import { Order } from "../../shared/constants/constants";

export class ProductSearchMultiDto extends PageOptionsDto {
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
  @Type(() => String)
  @IsOptional()
  readonly query?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  readonly category?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  readonly subCategory?: number;

  @ApiPropertyOptional({ enum: Order, default: Order.ASC })
  @IsOptional()
  readonly price?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 20,
    default: 11,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  readonly productLimit?: number = 11;

  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  @IsIn(["top", "recent"])
  readonly tag?: string;
}
