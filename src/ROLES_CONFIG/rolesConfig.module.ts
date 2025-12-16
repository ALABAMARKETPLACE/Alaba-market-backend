import { Module } from "@nestjs/common";
import { RolesConfigController } from "./rolesConfig.controller";
import { RolesConfigProviders } from "./rolesConfig.provider";
import { RolesConfigService } from "./rolesConfig.services";
import { MenusModule } from "../MENUS/menus.module";
@Module({
  imports: [MenusModule],
  controllers: [RolesConfigController],
  providers: [RolesConfigService, ...RolesConfigProviders],
  exports: [RolesConfigService],
})
export class RolesConfigModule {}
