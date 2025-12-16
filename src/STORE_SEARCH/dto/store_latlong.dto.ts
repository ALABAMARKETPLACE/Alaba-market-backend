import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsLatitude, IsLongitude, IsOptional, IsString } from "class-validator";

export class StoreLocationDto {
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
}

export class StoreLocationCategoryDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsLatitude()
  readonly lattitude?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsLongitude()
  readonly longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly category?: string;
}
