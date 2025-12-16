import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateAccountDetailsDto {
  @ApiProperty({ description: "Account name or identifying code" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  readonly account_name_or_code: string;

  @ApiProperty({ description: "Bank account number" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly account_number: string;
}

