import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { BoosterPlanConfig } from "../SELLER_BOOSTER/booster-plan-config.entity";
import { User } from "../USERS/user.entity";
import { BcryptProvider } from "../shared/providers/bcrypt.provider";
import { AdminAuditLog } from "./admin-audit-log.entity";
import { SuperAdminBootstrapService } from "./super-admin-bootstrap.service";
import { SuperAdminController } from "./super-admin.controller";
import { SuperAdminProviders } from "./super-admin.provider";
import { SuperAdminService } from "./super-admin.service";

@Module({
  imports: [SequelizeModule.forFeature([BoosterPlanConfig, AdminAuditLog, User])],
  controllers: [SuperAdminController],
  providers: [
    SuperAdminService,
    SuperAdminBootstrapService,
    ...SuperAdminProviders,
    ...BcryptProvider,
  ],
  exports: [SuperAdminService, ...SuperAdminProviders],
})
export class SuperAdminModule {}
