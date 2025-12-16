import { Module } from "@nestjs/common";
import { UserBankAccountController } from "./user_bank_accounts.controller";
import { UserBankAccountProviders } from "./user_bank_accounts.provider";
import { UserBankAccountService } from "./user_bank_accounts.service";

@Module({
  imports: [],
  controllers: [UserBankAccountController],
  providers: [UserBankAccountService, ...UserBankAccountProviders],
  exports: [UserBankAccountService],
})
export class UserBankAccountModule {}
