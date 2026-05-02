import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail } from "class-validator";

export class AdminForgotPasswordDto {
  @ApiProperty({ example: "admin@example.com" })
  @IsEmail({}, { message: "Please Provide a Valid email id" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  readonly email: string;
}
