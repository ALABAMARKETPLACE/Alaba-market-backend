import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateNewAddressDto {
  @ApiProperty()
  @IsOptional()
  @IsString({ message: "Address type must be a string" })
  @MinLength(1, { message: "Address type cannot be empty" })
  @MaxLength(50, { message: "Address type must be less than 50 characters" })
  readonly address_type?: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ message: "Full address must be a string" })
  @MinLength(1, { message: "Full address cannot be empty" })
  @MaxLength(500, { message: "Full address must be less than 500 characters" })
  readonly full_address?: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ message: "Pincode must be a string" })
  @MinLength(1, { message: "Pincode cannot be empty" })
  @MaxLength(20, { message: "Pincode must be less than 20 characters" })
  readonly pincode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ message: "Phone number must be a string" })
  @MinLength(10, { message: "Phone number must be at least 10 characters" })
  @MaxLength(20, { message: "Phone number must be less than 20 characters" })
  readonly phone_no?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber({}, { message: "Country ID must be a number" })
  @Type(() => Number)
  readonly country_id?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber({}, { message: "State ID must be a number" })
  @Type(() => Number)
  readonly state_id?: number;
}
