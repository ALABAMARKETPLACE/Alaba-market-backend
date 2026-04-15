import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { PaystackSubaccountController } from "./paystack-subaccount.controller";
import { PaystackSubaccountService } from "./paystack-subaccount.service";
import { PaystackSubaccountMigrationController } from "./paystack-subaccount-migration.controller";
import { PaystackSubaccountMigrationService } from "./paystack-subaccount-migration.service";
// import { paystackSubaccountProviders } from "./paystack-subaccount.providers";
import { HttpModule } from "@nestjs/axios";
// import { StoreProvider } from "../STORE/store.provider";
import { PaystackSubaccount } from "./paystack-subaccount.entity";
import { Store } from "../STORE/store.entity";
import { PaystackAccountConfigService } from "../PAYSTACK_PAYMENT/paystack-account-config.service";

@Module({
  imports: [
    HttpModule,
    SequelizeModule.forFeature([PaystackSubaccount, Store]),
  ],
  controllers: [
    PaystackSubaccountController,
    PaystackSubaccountMigrationController,
  ],
  providers: [
    PaystackSubaccountService,
    PaystackSubaccountMigrationService,
    PaystackAccountConfigService,
  ],
  exports: [PaystackSubaccountService, PaystackSubaccountMigrationService],
})
export class PaystackSubaccountModule {}
