import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength
} from "class-validator";

export class UpdateUserBankAccountDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255, { message: "Bank Name is too long" })
  @IsOptional()
  readonly bankName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(30, { message: "Account Number is too long" })
  @IsOptional()
  readonly accountNumber: string;

  @ApiProperty()
  @IsString()
  @MaxLength(34, { message: "Invalid IBAN" })
  @IsOptional()
  readonly iban: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50, { message: "Account Type is too long" })
  @IsOptional()
  readonly accountType: string;

  @ApiProperty()
  @IsString()
  @MaxLength(11, { message: "Invalid SWIFT Code" })
  @IsOptional()
  readonly swiftCode: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255, { message: "Branch Name is too long" })
  @IsOptional()
  readonly branchName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255, { message: "Branch Address is too long" })
  @IsOptional()
  readonly branchAddress: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20, { message: "Emirates ID is too long" })
  @IsOptional()
  readonly emiratesId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20, { message: "Phone Number is too long" })
  @IsOptional()
  readonly phoneNumber: string;

  @ApiProperty()
  @IsEnum(["active", "inactive"], {
    message: "Status must be 'active' or 'inactive'",
  })
  @IsOptional()
  readonly status: "active" | "inactive";

  @ApiProperty()
  @IsOptional()
  readonly isDefault: boolean;
}
