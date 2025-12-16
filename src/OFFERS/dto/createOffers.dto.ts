import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";

export class CreateOffersDto {
  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  readonly start_date: Date;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  readonly end_date: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUrl()
  readonly image: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
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
