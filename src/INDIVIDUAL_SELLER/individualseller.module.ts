import { Module } from "@nestjs/common";
import { IndividualSellerController } from "./individualseller.controller";
import { IndividualSellerService } from "./individualseller.service";
import { IndividualSellerProvider } from "./individualseller.provider";
import { EmailModule } from "../MAILS/Mails.module";
import { SettingsModule } from "../SETTINGS/settings.module";
import { NotificationsModule } from "../NOTIFICATIONS/notifications.module";

@Module({
  imports: [EmailModule, SettingsModule, NotificationsModule],
  controllers: [IndividualSellerController],
  providers: [IndividualSellerService, ...IndividualSellerProvider],
  exports: [IndividualSellerService, ...IndividualSellerProvider],
})
export class IndividualSellerModule {}
