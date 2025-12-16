import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
import { IsIn, IsOptional } from "class-validator";

export class ProductsByStoreDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    return value && value != "undefined" ? value : "";
  })
  readonly query: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["active", "inactive", "out_of_stock", "all", "instock"])
  readonly status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  readonly subCategory: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  readonly category: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    return value == "1" || value == "true" ? true : false;
  })
  readonly instock: boolean = false;
}
