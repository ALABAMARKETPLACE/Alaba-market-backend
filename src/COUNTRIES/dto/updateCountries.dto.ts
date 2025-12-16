import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, MaxLength, MinLength } from "class-validator";

export class UpdateCountriesDto {
  @ApiProperty()
  @IsOptional()
  @IsString({ message: "Country name must be a string" })
  @MinLength(1, { message: "Country name cannot be empty" })
  @MaxLength(200, { message: "Country name must be less than 200 characters" })
  readonly country_name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @MaxLength(300, { message: "Description must be less than 300 characters" })
  readonly description?: string;
}
