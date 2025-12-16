import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt } from "class-validator";

export class UploadProductsDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  readonly category: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  subCategory: number;
}
