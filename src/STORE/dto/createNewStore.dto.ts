import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEmail,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  Validate,
} from "class-validator";
import { ContainsPlusValidator } from "../../shared/validator/custom-validators";
import { Transform } from "class-transformer";

export class CreateNewStoreDto {
  @ApiProperty()
  @IsNotEmpty({ message: "Please provide a Firstname" })
  @IsString({ message: "Invalid Firstname" })
  @MaxLength(30, {
    message: "Firstname is too long, please choose another one.",
  })
  @ApiProperty()
  readonly first_name: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Please provide a Lastname" })
  @IsString({ message: "Invalid Lastname" })
  @MaxLength(30, {
    message: "Lastname is too long, please choose another one.",
  })
  readonly last_name: string;

  @ApiProperty()
  @IsEmail({}, { message: "Please provide a valid email address" })
  @MaxLength(50, {
    message: "Invalid Email Address Please use another one.",
  })
  readonly email: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Please provide a valid countrycode" })
  @IsString({ message: "Invalid input for Countrycode" })
  @MaxLength(6, {
    message: "Invalid Countrycode Please use another one.",
  })
  @Validate(ContainsPlusValidator)
  readonly code: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Please provide Password" })
  @IsString({ message: "Invalid input for Password" })
  @MaxLength(30, {
    message: "Password is too long, please choose another one.",
  })
  @MinLength(8, {
    message: "Password is too Short please choose another one",
  })
  @Transform(({ value }) => (typeof value == "string" ? value.trim() : value))
  readonly password: string;

  @ApiProperty()
  readonly business_location: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Please provide Business Address" })
  @IsString({ message: "Invalid input for Business Address" })
  @MaxLength(200, {
    message: "Business Address is too long, please choose another one.",
  })
  readonly business_address: string;

  @ApiPropertyOptional()
  readonly agreement: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Please Input TRN Number" })
  @MaxLength(30, {
    message: "TRN Number is too long, please choose another one.",
  })
  readonly trn_number: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Please Input Trade Liscence Number" })
  @MaxLength(30, {
    message: "Trade Liscence Number is too long, please choose another one.",
  })
  readonly trade_lisc_no: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Please Input Seller Name" })
  @MaxLength(50, {
    message: "Seller Name is too long, please choose another one.",
  })
  readonly seller_name: string;

  @ApiPropertyOptional()
  readonly seller_country: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly account_name_or_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly account_number?: string;

  @ApiProperty()
  readonly is_print_available: boolean;

  @ApiPropertyOptional()
  readonly birth_country: string;

  @ApiPropertyOptional()
  readonly dob: Date;

  @ApiProperty()
  @IsNotEmpty({ message: "Please Provide ID Proof" })
  @MaxLength(220, {
    message: "Url is not valid",
  })
  @IsUrl({}, { message: "Invalid Url For ID proof" })
  readonly id_proof: string;

  @ApiPropertyOptional()
  readonly id_type: string;

  @ApiPropertyOptional()
  readonly id_issue_country: string;

  @ApiPropertyOptional()
  readonly id_expiry_date: Date;

  @ApiProperty()
  @IsNotEmpty({ message: "Please Provide the Store name" })
  @MaxLength(50, {
    message: "Store name is too long Choose another one",
  })
  readonly store_name: string;

  @ApiPropertyOptional()
  readonly upscs: string;

  @ApiPropertyOptional()
  readonly manufacture: string;

  @ApiProperty()
  @IsUrl({}, { message: "Invalid Url For Trn" })
  @MaxLength(220, {
    message: "Url is not valid",
  })
  readonly trn_upload: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Please Provide the Lattitude" })
  @IsLatitude({ message: "Lattitude is Invalid" })
  readonly lat: number;

  @ApiProperty()
  @IsNotEmpty({ message: "Please Provide the Longitude" })
  @IsLongitude({ message: "Longitude is Invalid" })
  readonly long: number;

  // COMMENTED: OTP verification disabled - idToken is now optional
  // @ApiProperty()
  @ApiPropertyOptional()
  readonly idToken?: string;

  @ApiPropertyOptional()
  readonly phone?: string;

  @ApiProperty()
  readonly business_types: JSON;

  @ApiProperty()
  readonly auto_approve_refund: boolean;

  @ApiProperty()
  readonly allow_refund: boolean;

  @ApiPropertyOptional()
  readonly subscription_plan_id?: number;

  @ApiPropertyOptional()
  readonly subscription_plan?: string;

  @ApiPropertyOptional()
  readonly subscription_plan_name?: string;

  @ApiPropertyOptional()
  readonly subscription_price?: number;

  @ApiPropertyOptional()
  readonly subscription_boosts?: number;

  // Paystack Subaccount Fields
  @ApiPropertyOptional()
  readonly settlement_bank?: string;

  @ApiPropertyOptional()
  readonly settlement_account_number?: string;

  @ApiPropertyOptional()
  readonly settlement_account_name?: string;

  @ApiPropertyOptional()
  readonly business_name?: string;

  @ApiPropertyOptional()
  readonly primary_contact_name?: string;

  @ApiPropertyOptional()
  readonly primary_contact_phone?: string;

  @ApiPropertyOptional()
  readonly create_subaccount?: boolean;
}
