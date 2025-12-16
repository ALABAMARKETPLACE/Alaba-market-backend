import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail } from "class-validator";

export class ForgotPasswordDto {
  @IsEmail({}, { message: "Please Provide a Valid email id" })
  @ApiProperty()
  @Transform(({ value }) => value?.toLowerCase())
  readonly email: string;
}
