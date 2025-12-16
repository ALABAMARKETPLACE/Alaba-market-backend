import { UserBankAccount } from "./user_bank_accounts.entity";

export const UserBankAccountProviders = [
  { provide: "UserBankAccountRepository", useValue: UserBankAccount },
];
