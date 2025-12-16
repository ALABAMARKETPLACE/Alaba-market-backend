import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";

export class UpdateRefundRequestDto {
  @ApiPropertyOptional({
    description: "Admin note about the decision",
    example: "Approved based on photo evidence",
  })
  @IsOptional()
  @IsString({ message: "Invalid note format" })
  @MaxLength(500, {
    message: "Note is too long, please be more concise",
  })
  @Transform(({ value }) => (typeof value == "string" ? value.trim() : value))
  readonly admin_note?: string;
}
