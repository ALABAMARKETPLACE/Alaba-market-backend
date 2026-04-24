import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class SendTestMailDto {
  @IsEmail()
  to: string;

  @ApiPropertyOptional({
    description: "Optional email subject override",
    example: "Mailtrap connectivity test",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;
}
