import { Module } from "@nestjs/common";
import { RolesController } from "./roles.controller";
import { RolesProviders } from "./roles.provider";
import { RolesService } from "./roles.services";
@Module({
  imports: [],
  controllers: [RolesController],
  providers: [RolesService, ...RolesProviders],
  exports: [RolesService],
})
export class RolesModule {}
