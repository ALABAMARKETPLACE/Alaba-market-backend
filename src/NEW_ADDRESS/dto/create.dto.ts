import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsNumber,
  ValidateIf,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateNewAddressDto {
  @ApiProperty({
    description: "Address label such as home, office, or warehouse.",
    example: "home",
  })
  @IsString({ message: "Address type must be a string" })
  @MinLength(1, { message: "Address type is required" })
  @MaxLength(50, { message: "Address type must be less than 50 characters" })
  readonly address_type: string;

  @ApiProperty({
    description: "Full delivery address.",
    example: "12 Test Street, Ikeja, Lagos",
  })
  @IsString({ message: "Full address must be a string" })
  @MinLength(1, { message: "Full address is required" })
  @MaxLength(500, { message: "Full address must be less than 500 characters" })
  readonly full_address: string;

  @ApiProperty({
    description: "Postal code or pincode for the address.",
    example: "100001",
  })
  @IsString({ message: "Pincode must be a string" })
  @MinLength(1, { message: "Pincode is required" })
  @MaxLength(20, { message: "Pincode must be less than 20 characters" })
  readonly pincode: string;

  @ApiProperty({
    description: "Primary phone number for delivery contact.",
    example: "08000000000",
  })
  @IsString({ message: "Phone number must be a string" })
  @MinLength(10, { message: "Phone number must be at least 10 characters" })
  @MaxLength(20, { message: "Phone number must be less than 20 characters" })
  readonly phone_no: string;

  @ApiProperty({
    description:
      "Country ID. Optional when state_id is provided, but at least one of country_id or state_id must be present.",
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: "Country ID must be a number" })
  @Type(() => Number)
  @ValidateIf((o) => !o.state_id)
  readonly country_id?: number;

  @ApiProperty({
    description:
      "State ID. Optional when country_id is provided, but at least one of state_id or country_id must be present.",
    required: false,
    example: 25,
  })
  @IsOptional()
  @IsNumber({}, { message: "State ID must be a number" })
  @Type(() => Number)
  @ValidateIf((o) => !o.country_id)
  readonly state_id?: number;
}
