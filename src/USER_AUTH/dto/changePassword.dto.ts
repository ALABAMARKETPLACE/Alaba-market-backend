import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength } from "class-validator";

export class ChangePasswordDto {
  @IsNotEmpty({ message: "UnAuthorized Access" })
  @ApiProperty()
  readonly token: string;

  @IsNotEmpty({ message: "Please provide Password" })
  @MaxLength(40, { message: "Password Length is too long" })
  @ApiProperty()
  readonly password: string;
}
