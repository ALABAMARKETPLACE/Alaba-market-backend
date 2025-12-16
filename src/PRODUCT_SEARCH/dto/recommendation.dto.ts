import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsLatitude, IsLongitude, IsOptional } from "class-validator";

export class RecommendationDto {
  @ApiProperty()
  @Type(() => String)
  readonly query: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100000, default: 5 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly radius: number = 5;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsLatitude()
  @IsOptional()
  readonly lattitude: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsLongitude()
  @IsOptional()
  readonly longitude: number;
}
