import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength, Validate } from "class-validator";
import { ContainsPlusValidator } from "../../shared/validator/custom-validators";

export class UserPhoneUpdateDto {
  @ApiProperty()
  @IsNotEmpty({ message: "Unauthorized Action." })
  readonly idToken:string;

  @IsNotEmpty({ message: "Please provide a valid countrycode" })
  @IsString({ message: "Invalid input for Countrycode" })
  @MaxLength(6, {
    message: "Invalid Countrycode Please use another one.",
  })
  @ApiProperty()
  @Validate(ContainsPlusValidator)
  readonly countryCode: string;
}
