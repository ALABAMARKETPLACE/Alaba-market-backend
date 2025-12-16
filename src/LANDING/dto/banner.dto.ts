import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Max, Min } from "class-validator";
import { Order } from "../../shared/constants/constants";
export class LandingBannerDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsLatitude()
  readonly lat?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsLongitude()
  readonly long?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 20, default: 4 })
  @Type(() => Number)
  @IsOptional()
  readonly radius?: number;
}
