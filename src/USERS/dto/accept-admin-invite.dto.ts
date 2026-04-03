import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class AcceptAdminInviteDto {
  @ApiProperty()
  @IsNotEmpty({ message: "Unauthorized Access" })
  readonly token: string;

  @ApiProperty()
  @IsOptional()
  @MaxLength(40, { message: "Password Length is too long" })
  @MinLength(8, {
    message: "Password Length is too short, atleast contain 8 chars",
  })
  readonly password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  readonly first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  readonly last_name?: string;
}
