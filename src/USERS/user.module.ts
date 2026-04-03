import { forwardRef, Module } from "@nestjs/common";

import { UserController } from "./user.controller";
import { UserProviders } from "./user.provider";
import { UserService } from "./user.services";
import { EmailModule } from "../MAILS/Mails.module";
import { BcryptProvider } from "../shared/providers/bcrypt.provider";
import { UsersManagementController } from "./users-management.controller";
import { StoreModule } from "../STORE/store.module";

@Module({
  imports: [EmailModule, forwardRef(() => StoreModule)],
  controllers: [UserController, UsersManagementController],
  providers: [UserService, ...UserProviders, ...BcryptProvider],
  exports: [UserService],
})
export class UserModule {}
