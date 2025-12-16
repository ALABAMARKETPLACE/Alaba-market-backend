import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MaxLength } from "class-validator";

export class UserEmailUpdateDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  @MaxLength(50, {
    message: "Invalid Email Address Please use another one.",
  })
  @ApiProperty()
  readonly email: string;
}
