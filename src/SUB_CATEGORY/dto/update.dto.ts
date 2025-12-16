import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsUrl,
  MaxLength,
} from "class-validator";

export class UpdateSubCategoryDto {
  @ApiProperty()
  @MaxLength(50)
  @IsOptional()
  readonly name: string;

  @ApiProperty()
  @IsOptional()
  @MaxLength(200)
  readonly description: string;

  @ApiProperty()
  @IsUrl()
  @IsOptional()
  readonly image: string;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  readonly category_id: number;

  @ApiProperty()
  @IsOptional()
  @IsUrl()
  readonly bannerImg?: string;
}
