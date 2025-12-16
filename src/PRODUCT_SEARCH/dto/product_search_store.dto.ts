import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
import { Order } from "../../shared/constants/constants";

export class ProductSearchStoreDto extends PageOptionsDto {
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
}
