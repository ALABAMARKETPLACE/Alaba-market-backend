import { Module } from "@nestjs/common";

import { UserController } from "./user.controller";
import { UserProviders } from "./user.provider";
import { UserService } from "./user.services";
import { EmailModule } from "../MAILS/Mails.module";
import { BcryptProvider } from "../shared/providers/bcrypt.provider";

@Module({
  imports: [EmailModule],
  controllers: [UserController],
  providers: [UserService, ...UserProviders, ...BcryptProvider],
  exports: [UserService],
})
export class UserModule {}
