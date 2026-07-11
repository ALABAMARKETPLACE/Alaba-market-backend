import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";

export class AuthChangePasswordDto {
  @ApiProperty({ example: "OldPassword123!" })
  @IsNotEmpty({ message: "Please provide your current password" })
  readonly oldPassword: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsNotEmpty({ message: "Please provide a new password" })
  @MaxLength(72, { message: "Password Length is too long" })
  @MinLength(8, {
    message: "Password Length is too short, atleast contain 8 chars",
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      "Password must include uppercase, lowercase, number, and special character",
  })
  readonly newPassword: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsNotEmpty({ message: "Please confirm your new password" })
  readonly confirmPassword: string;
}
