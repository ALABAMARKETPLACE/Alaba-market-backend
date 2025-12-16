import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber } from "class-validator";

export class RequestDocumentMailDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly subject: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  readonly id: number;
}
