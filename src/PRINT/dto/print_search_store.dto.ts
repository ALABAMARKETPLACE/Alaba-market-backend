import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class PrintSearchStoreDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  readonly orderId?: number;

  @ApiPropertyOptional()
  @IsString()
  @Type(() => String)
  @IsOptional()
  readonly from?: string;

  @ApiPropertyOptional()
  @IsString()
  @Type(() => String)
  @IsOptional()
  readonly to?: string;

  @ApiPropertyOptional()
  @IsString()
  @Type(() => String)
  @IsOptional()
  readonly status?: string;
}
