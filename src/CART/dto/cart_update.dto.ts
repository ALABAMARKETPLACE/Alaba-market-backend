import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";

export class CartUpdateDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  readonly quantity: number;
}
