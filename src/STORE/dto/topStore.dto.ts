import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsLatitude, IsLongitude, IsOptional } from "class-validator";
export class TopSellingStoresDto {
  @ApiPropertyOptional({
    minimum: 5,
    maximum: 10,
    default: 6,
  })
  @Type(() => Number)
  @IsOptional()
  readonly take?: number = 10;

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
