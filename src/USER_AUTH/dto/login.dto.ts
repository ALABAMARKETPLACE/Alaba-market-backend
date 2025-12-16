import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
} from "class-validator";
import { ContainsPlusValidator } from "../../shared/validator/custom-validators";
import { Transform } from "class-transformer";

export class login_Request {
  @IsEmail({}, { message: "Please Provide a Valid Email ID" })
  @ApiProperty()
  @Transform(({ value }) => value?.toLowerCase())
  readonly email: string;

  @IsNotEmpty({ message: "Please provide Password" })
  @MaxLength(40, { message: "Password Length is too long" })
  @ApiProperty()
  @IsString()
  readonly password: string;

  @MaxLength(200, { message: "fsm token Length is too long" })
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly fcmtoken: string;

  @MaxLength(200, { message: "fsm token Length is too long" })
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly seller_fcmtoken: string;
}

export class login_phone {
  @IsNotEmpty({ message: "Please provide a valid countrycode" })
  @MaxLength(6, {
    message: "Invalid Countrycode Please use another one.",
  })
  @Validate(ContainsPlusValidator)
  @ApiProperty()
  @Transform(({ value }) => value?.trim())
  readonly code: string;

  @IsNotEmpty({ message: "UnAuthorized Access" })
  @ApiProperty()
  readonly idToken: string;

  @MaxLength(200, { message: "fsm token Length is too long" })
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly fcmtoken: string;
}

export class login_google {
  @IsNotEmpty({ message: "UnAuthorized Access" })
  @ApiProperty()
  readonly idToken: string;

  @MaxLength(200, { message: "fsm token Length is too long" })
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly fcmtoken: string;
}
export class login_apple {
  @IsNotEmpty({ message: "UnAuthorized Access" })
  @ApiProperty()
  readonly idToken: string;

  @MaxLength(200, { message: "fsm token Length is too long" })
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly fcmtoken: string;
}
