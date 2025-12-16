import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";

export class CreateSubCategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  readonly name: string;

  @ApiProperty()
  @IsOptional()
  @MaxLength(200)
  readonly description: string;

  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  readonly image: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  readonly category_id: number;

  @ApiProperty()
  @IsOptional()
  @IsUrl()
  readonly bannerImg?: string;
}
