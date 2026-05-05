import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export class UnifiedChangePasswordDto {
  @ApiProperty({ example: "OldPassword123!" })
  @IsNotEmpty({ message: "Please provide your current password" })
  readonly oldPassword: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsNotEmpty({ message: "Please provide a new password" })
  @MaxLength(72, { message: "Password Length is too long" })
  @MinLength(8, {
    message: "Password Length is too short, atleast contain 8 chars",
  })
  @Matches(PASSWORD_PATTERN, {
    message:
      "Password must include uppercase, lowercase, number, and special character",
  })
  readonly newPassword: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsNotEmpty({ message: "Please confirm your new password" })
  readonly confirmPassword: string;
}

export class UnifiedForgotPasswordDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail({}, { message: "Please Provide a Valid email id" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  readonly email: string;
}

export class UnifiedResetPasswordDto {
  @ApiProperty({ example: "reset-token" })
  @IsNotEmpty({ message: "Invalid or expired password reset token" })
  readonly token: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsNotEmpty({ message: "Please provide a new password" })
  @MaxLength(72, { message: "Password Length is too long" })
  @MinLength(8, {
    message: "Password Length is too short, atleast contain 8 chars",
  })
  @Matches(PASSWORD_PATTERN, {
    message:
      "Password must include uppercase, lowercase, number, and special character",
  })
  readonly newPassword: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsNotEmpty({ message: "Please confirm your new password" })
  readonly confirmPassword: string;
}
