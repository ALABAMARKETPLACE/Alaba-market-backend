import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";

export class UpdateOffersDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  readonly start_date: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  readonly end_date: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly title: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  readonly image: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly tag: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly comment: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly status: boolean;

  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsOptional()
  readonly products: number[] = [];
}
