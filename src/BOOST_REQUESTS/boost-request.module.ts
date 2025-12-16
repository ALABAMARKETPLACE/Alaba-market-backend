import { Module } from "@nestjs/common";
import { BoostRequestController } from "./boost-request.controller";
import { BoostRequestProviders } from "./boost-request.provider";
import { BoostRequestService } from "./boost-request.service";
import { SubscriptionPlanModule } from "../SUBSCRIPTION_PLANS/subscription-plan.module";
import { ProductsModule } from "../PRODUCTS/products.module";
import { IndividualSellerModule } from "../INDIVIDUAL_SELLER/individualseller.module";
import { EmailModule } from "../MAILS/Mails.module";
import { SettingsModule } from "../SETTINGS/settings.module";
import { StoreModule } from "../STORE/store.module";

@Module({
  imports: [
    SubscriptionPlanModule,
    ProductsModule,
    IndividualSellerModule,
    StoreModule,
    EmailModule,
    SettingsModule,
  ],
  controllers: [BoostRequestController],
  providers: [BoostRequestService, ...BoostRequestProviders],
  exports: [BoostRequestService, ...BoostRequestProviders],
})
export class BoostRequestModule {}
