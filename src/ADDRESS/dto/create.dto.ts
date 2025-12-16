import { ApiProperty } from "@nestjs/swagger";
import {
  IsLatitude,
  IsLongitude,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateAddressDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50, { message: "Flat Number is too long" })
  readonly flat: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200, { message: "Address is too long" })
  readonly fullAddress: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50, { message: "Invalid Pincode" })
  readonly pin_code: string;

  @ApiProperty()
  @IsString()
  readonly state: string;

  @ApiProperty()
  @IsString()
  readonly city: string;

  @ApiProperty()
  @IsString()
  readonly country: string;

  @ApiProperty()
  @IsString()
  readonly street: string;

  @ApiProperty()
  @IsString()
  @MaxLength(16, { message: "Invalid Phone Number" })
  @MinLength(8, { message: "Invalid Phone Number" })
  readonly alt_phone: string;

  @ApiProperty()
  @IsString()
  @MaxLength(6, { message: "Invalid Country code" })
  readonly code: string;

  @ApiProperty()
  @MaxLength(10, { message: "Invalid Address Type" })
  readonly type: string;

  @ApiProperty()
  @IsLatitude({ message: "Invalid Lattitude" })
  readonly lat: number;

  @ApiProperty()
  @IsLongitude({ message: "Invalid Longitude" })
  readonly long: number;
}
