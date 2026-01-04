import { Module } from "@nestjs/common";
import { OrderSubstitutionService } from "./substitution.service";
import { SubstitutionController } from "./substitution.controller";
import { TokenGatewayModule } from "../SUBSTITUTION_SOKET/token.module";
import { NotificationsModule } from "../NOTIFICATIONS/notifications.module";
import { SequelizeModule } from "@nestjs/sequelize";
import { OrderSubstitution } from "./substitution.entity";
import { SubstituteProducts } from "./substitute.products.entity";

@Module({
  imports: [
    TokenGatewayModule,
    NotificationsModule,
    SequelizeModule.forFeature([OrderSubstitution, SubstituteProducts]),
  ],
  providers: [OrderSubstitutionService],
  controllers: [SubstitutionController],
  exports: [OrderSubstitutionService],
})
export class SubstitutionModule {}
