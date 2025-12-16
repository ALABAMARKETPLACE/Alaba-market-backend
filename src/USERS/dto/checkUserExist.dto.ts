import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CheckUserExistDto {
  @ApiProperty()
  @Type(() => String)
  @IsString()
  @IsEmail({}, { message: "Please provide a Valid email iD" })
  readonly email: string;

  @ApiProperty()
  @Type(() => String)
  @IsString()
  @MaxLength(16, {
    message: "Invalid Phone number.",
  })
  @MinLength(8, {
    message: "Invalid Phone number.",
  })
  @Matches(/^\+?[0-9-]+$/, {
    message: "Invalid phone number format.",
  })
  readonly phone: string;
}
