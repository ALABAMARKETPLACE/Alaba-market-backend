import { ApiProperty } from "@nestjs/swagger";
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateAddressDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50, { message: "Flat Number is too long" })
  @IsOptional()
  readonly flat: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200, { message: "Address is too long" })
  @IsOptional()
  readonly fullAddress: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50, { message: "Invalid Pincode" })
  @IsOptional()
  readonly pin_code: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly state: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly city: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly street: string;

  @ApiProperty()
  @IsString()
  @MaxLength(16, { message: "Invalid Phone Number" })
  @MinLength(8, { message: "Invalid Phone Number" })
  @IsOptional()
  readonly alt_phone: string;

  @ApiProperty()
  @IsString()
  @MaxLength(6, { message: "Invalid Country code" })
  @IsOptional()
  readonly code: string;

  @ApiProperty()
  @MaxLength(10, { message: "Invalid Address Type" })
  @IsOptional()
  readonly type: string;

  @ApiProperty()
  @IsLatitude({ message: "Invalid Latitude" })
  @IsOptional()
  readonly lat: number;

  @ApiProperty()
  @IsLongitude({ message: "Invalid Longitude" })
  @IsOptional()
  readonly long: number;
}
