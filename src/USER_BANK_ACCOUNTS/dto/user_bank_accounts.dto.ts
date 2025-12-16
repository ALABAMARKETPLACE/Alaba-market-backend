import { ApiProperty } from "@nestjs/swagger";
import { UserBankAccount } from "../user_bank_accounts.entity";

export class UserBankAccountDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly userId: number;

  @ApiProperty()
  readonly accountHolderName: string;

  @ApiProperty()
  readonly bankName: string;

  @ApiProperty()
  readonly accountNumber: string;

  @ApiProperty()
  readonly iban: string;

  @ApiProperty()
  readonly accountType: string;

  @ApiProperty()
  readonly swiftCode: string;

  @ApiProperty()
  readonly branchName: string;

  @ApiProperty()
  readonly branchAddress: string;

  @ApiProperty()
  readonly emiratesId: string;

  @ApiProperty()
  readonly phoneNumber: string;

  @ApiProperty()
  readonly accountCreationDate: Date;

  @ApiProperty()
  readonly isDelete: boolean;

  @ApiProperty()
  readonly status: "active" | "inactive";

  @ApiProperty()
  readonly isDefault: boolean;

  constructor(userBankAccount: UserBankAccount) {
    this.id = userBankAccount.id;
    this.userId = userBankAccount.userId;
    this.accountHolderName = userBankAccount.accountHolderName;
    this.bankName = userBankAccount.bankName;
    this.accountNumber = userBankAccount.accountNumber;
    this.iban = userBankAccount.iban;
    this.accountType = userBankAccount.accountType;
    this.swiftCode = userBankAccount.swiftCode;
    this.branchName = userBankAccount.branchName;
    this.isDelete = userBankAccount.isDelete;
    this.branchAddress = userBankAccount.branchAddress;
    this.emiratesId = userBankAccount.emiratesId;
    this.phoneNumber = userBankAccount.phoneNumber;
    this.accountCreationDate = userBankAccount.accountCreationDate;
    this.status = userBankAccount.status;
    this.isDefault = userBankAccount.isDefault;
  }
}
