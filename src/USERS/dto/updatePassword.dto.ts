import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength, MinLength } from "class-validator";

export class UserPasswordUpdateDto {
  @IsNotEmpty({ message: "Please provide your Previous password" })
  @ApiProperty()
  readonly oldPassword: string;

  @IsNotEmpty({ message: "Please provide a valid Password" })
  @MaxLength(20, {
    message: "Password Length is too long, please choose another one.",
  })
  @MinLength(8, {
    message: "Password Length is too short, atleast contain 8 chars",
  })
  @ApiProperty()
  readonly newPassword: string;
}

export class UserAddPasswordUpdateDto {
  @IsNotEmpty({ message: "Please provide a valid Password" })
  @MaxLength(20, {
    message: "Password Length is too long, please choose another one.",
  })
  @MinLength(8, {
    message: "Password Length is too short, atleast contain 8 chars",
  })
  @ApiProperty()
  readonly newPassword: string;
}
