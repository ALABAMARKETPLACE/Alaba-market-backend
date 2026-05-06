import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength, MinLength } from "class-validator";

export class AdminResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty({ message: "Please provide Password" })
  @MaxLength(40, { message: "Password Length is too long" })
  @MinLength(8, {
    message: "Password Length is too short, atleast contain 8 chars",
  })
  readonly password: string;
}
