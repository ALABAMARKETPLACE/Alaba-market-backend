import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDate, IsEnum, IsNumber, IsString, MaxLength } from "class-validator";

export class CreateUserBankAccountDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255, { message: "Account Holder Name is too long" })
  readonly accountHolderName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255, { message: "Bank Name is too long" })
  readonly bankName: string;

  @ApiProperty({ type: String })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  readonly accountCreationDate: Date;

  @ApiProperty()
  @IsString()
  @MaxLength(30, { message: "Account Number is too long" })
  readonly accountNumber: string;


  @ApiProperty()
  @IsString()
  @MaxLength(34, { message: "Invalid IBAN" })
  readonly iban: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50, { message: "Account Type is too long" })
  readonly accountType: string;

  @ApiProperty()
  @IsString()
  @MaxLength(11, { message: "Invalid SWIFT Code" })
  readonly swiftCode: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255, { message: "Branch Name is too long" })
  readonly branchName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255, { message: "Branch Address is too long" })
  readonly branchAddress: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20, { message: "Emirates ID is too long" })
  readonly emiratesId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20, { message: "Phone Number is too long" })
  readonly phoneNumber: string;

  @ApiProperty()
  @IsEnum(["active", "inactive"], {
    message: "Status must be 'active' or 'inactive'",
  })
  readonly status: "active" | "inactive";

  @ApiProperty()
  readonly isDefault: boolean;
}
