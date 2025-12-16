import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsBoolean } from "class-validator";

export class CreateSubaccountDto {
  @ApiProperty()
  @IsNotEmpty({ message: "Business name is required" })
  @IsString({ message: "Business name must be a string" })
  readonly business_name: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Settlement bank is required" })
  @IsString({ message: "Settlement bank must be a string" })
  readonly settlement_bank: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Settlement account number is required" })
  @IsString({ message: "Settlement account number must be a string" })
  readonly settlement_account_number: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Settlement account name is required" })
  @IsString({ message: "Settlement account name must be a string" })
  readonly settlement_account_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: "Primary contact email must be valid" })
  readonly primary_contact_email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly primary_contact_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly primary_contact_phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly settlement_schedule?: string; // auto, weekly, monthly
}

export class ApproveSubaccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly approval_note?: string;
}

export class RejectSubaccountDto {
  @ApiProperty()
  @IsNotEmpty({ message: "Rejection reason is required" })
  @IsString({ message: "Rejection reason must be a string" })
  readonly rejection_reason: string;
}