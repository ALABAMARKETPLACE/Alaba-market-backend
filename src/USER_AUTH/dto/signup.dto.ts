import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEmail,
  Validate,
  MinLength,
  IsOptional,
} from "class-validator";
import { ContainsPlusValidator } from "../../shared/validator/custom-validators";

export class signup_Request {
  @IsNotEmpty({ message: "Please provide a valid Password" })
  @MaxLength(20, {
    message: "Password Length is too long, please choose another one.",
  })
  @MinLength(8, {
    message: "Password Length is too short, atleast contain 8 chars",
  })
  @ApiProperty()
  readonly password: string;

  @ApiProperty()
  @IsOptional()
  readonly phone: string;

  @IsNotEmpty({ message: "Please provide a First name" })
  @MaxLength(50, {
    message: "Invalid FirstName Please use another one.",
  })
  @ApiProperty()
  readonly first_name: string;

  @IsNotEmpty({ message: "Please provide Lastname" })
  @MaxLength(50, {
    message: "Invalid LastName Please use another one.",
  })
  @ApiProperty()
  readonly last_name: string;

  @IsEmail({}, { message: "Please provide a valid email address" })
  @MaxLength(50, {
    message: "Invalid Email Address Please use another one.",
  })
  @ApiProperty()
  readonly email: string;

  @IsNotEmpty({ message: "Please provide a valid countrycode" })
  @IsString({ message: "Invalid input for Countrycode" })
  @MaxLength(6, {
    message: "Invalid Countrycode Please use another one.",
  })
  @Validate(ContainsPlusValidator)
  @ApiProperty()
  readonly countrycode: string;

  // COMMENTED: OTP verification disabled - idToken is now optional
  // @IsNotEmpty({ message: "Unauthorized Access" })
  @ApiPropertyOptional()
  @IsOptional()
  readonly idToken: string;

  @MaxLength(200, { message: "fsm token Length is too long" })
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly fcmtoken: string;
}
