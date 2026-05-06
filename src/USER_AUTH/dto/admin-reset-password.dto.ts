import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";

export class AdminResetPasswordDto {
  @ApiProperty({ example: "reset-token" })
  @IsNotEmpty({ message: "UnAuthorized Access" })
  readonly token: string;

  @ApiProperty({ example: "NewStrongPassword123!" })
  @IsNotEmpty({ message: "Please provide Password" })
  @MaxLength(72, { message: "Password Length is too long" })
  @MinLength(12, {
    message: "Password Length is too short, atleast contain 12 chars",
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      "Password must include uppercase, lowercase, number, and special character",
  })
  readonly newPassword: string;
}
