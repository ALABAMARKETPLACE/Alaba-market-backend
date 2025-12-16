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
  @ApiProperty()
  @IsString({ message: "Address type must be a string" })
  @MinLength(1, { message: "Address type is required" })
  @MaxLength(50, { message: "Address type must be less than 50 characters" })
  readonly address_type: string;

  @ApiProperty()
  @IsString({ message: "Full address must be a string" })
  @MinLength(1, { message: "Full address is required" })
  @MaxLength(500, { message: "Full address must be less than 500 characters" })
  readonly full_address: string;

  @ApiProperty()
  @IsString({ message: "Pincode must be a string" })
  @MinLength(1, { message: "Pincode is required" })
  @MaxLength(20, { message: "Pincode must be less than 20 characters" })
  readonly pincode: string;

  @ApiProperty()
  @IsString({ message: "Phone number must be a string" })
  @MinLength(10, { message: "Phone number must be at least 10 characters" })
  @MaxLength(20, { message: "Phone number must be less than 20 characters" })
  readonly phone_no: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber({}, { message: "Country ID must be a number" })
  @Type(() => Number)
  @ValidateIf((o) => !o.state_id)
  readonly country_id?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber({}, { message: "State ID must be a number" })
  @Type(() => Number)
  @ValidateIf((o) => !o.country_id)
  readonly state_id?: number;
}
