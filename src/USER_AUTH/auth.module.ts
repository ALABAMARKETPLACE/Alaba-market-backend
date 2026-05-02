import { Global, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AdminAuthController } from "./admin-auth.controller";
import { AuthService } from "./auth.service";

import { UserModule } from "../USERS/user.module";
import { EmailModule } from "../MAILS/Mails.module";
import { RolesConfigModule } from "../ROLES_CONFIG/rolesConfig.module";
import { UserProviders } from "../USERS/user.provider";
import { TokenManagementModule } from "../TOKEN_MANAGEMENT/module";
import { AuthRepository } from "./auth.repository";
import { BcryptProvider } from "../shared/providers/bcrypt.provider";
@Global()
@Module({
  imports: [UserModule, EmailModule, RolesConfigModule, TokenManagementModule],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService, ...UserProviders, AuthRepository, ...BcryptProvider],
  exports: [AuthService],
})
export class AuthModule {}
