import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Max, Min } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
import { Order } from "../../shared/constants/constants";

export class ProductSearchByCategory extends PageOptionsDto {
  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  readonly query?: string;

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
}

export class ProductSearchItemByCategory extends PageOptionsDto {
  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  readonly query?: string;

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
    @Type(() => Number)
    @IsLatitude()
    readonly lattitude?: number;
  
    @ApiPropertyOptional()
    @Type(() => Number)
    @IsLongitude()
    readonly longitude?: number;
  
    @ApiPropertyOptional()
    @IsString()
    readonly category?: string;
}
