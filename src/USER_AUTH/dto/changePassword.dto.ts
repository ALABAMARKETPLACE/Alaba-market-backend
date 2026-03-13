import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsNotEmpty({ message: "UnAuthorized Access" })
  @ApiProperty()
  readonly token: string;

  @IsNotEmpty({ message: "Please provide Password" })
  @MaxLength(40, { message: "Password Length is too long" })
  @MinLength(8, {
    message: "Password Length is too short, atleast contain 8 chars",
  })
  @ApiProperty()
  readonly password: string;
}
