import { Module } from "@nestjs/common";
import { StoreController } from "./store.controller";
import { StoreService } from "./store.service";
import { StoreProvider } from "./store.provider";
import { EmailModule } from "../MAILS/Mails.module";
import { UserModule } from "../USERS/user.module";
import { SettingsModule } from "../SETTINGS/settings.module";
import { SlugifyProvider } from "../shared/providers/slugify.provider";
import { SettlementsModule } from "../SETTLEMENTS/settlements.module";
import { NotificationsModule } from "../NOTIFICATIONS/notifications.module";
import { PaystackSubaccountModule } from "../PAYSTACK_SUBACCOUNTS/paystack-subaccount.module";

@Module({
  imports: [
    UserModule,
    EmailModule,
    SettingsModule,
    SettlementsModule,
    NotificationsModule,
    PaystackSubaccountModule,
  ],
  controllers: [StoreController],
  providers: [StoreService, ...StoreProvider, ...SlugifyProvider],
  exports: [StoreService, ...StoreProvider],
})
export class StoreModule {}
