import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsLatitude, IsLongitude, IsOptional } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
export class TopSellingStoresDto extends PageOptionsDto {
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

  @ApiPropertyOptional({ minimum: 1, maximum: 20, default: 4 })
  @Type(() => Number)
  @IsOptional()
  readonly radius?: number;
}
