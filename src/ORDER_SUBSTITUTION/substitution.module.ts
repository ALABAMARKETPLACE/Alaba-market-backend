import { Module } from "@nestjs/common";
import { OrderSubstitutionService } from "./substitution.service";
import { SubstitutionProviders } from "./substitution.provider";
import { SubstitutionController } from "./substitution.controller";
import { TokenGatewayModule } from "../SUBSTITUTION_SOKET/token.module";
import { NotificationsModule } from "../NOTIFICATIONS/notifications.module";

@Module({
  imports: [TokenGatewayModule,NotificationsModule],
  providers: [OrderSubstitutionService, ...SubstitutionProviders],
  controllers: [SubstitutionController],
  exports: [OrderSubstitutionService],
})
export class SubstitutionModule {}
