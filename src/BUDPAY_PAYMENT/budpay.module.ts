import { Module, forwardRef } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SequelizeModule } from "@nestjs/sequelize";

import { BudPayController } from "./budpay.controller";
import { BudPayService } from "./budpay.service";
import { User } from "../USERS/user.entity";
import { GuestCheckout } from "../PAYSTACK_PAYMENT/guest-checkout.entity";
import { UserCheckout } from "../PAYSTACK_PAYMENT/user-checkout.entity";
import { OrderModule } from "../ORDER/order.module";
import { PaystackModule } from "../PAYSTACK_PAYMENT/paystack.module";
import { Store } from "../STORE/store.entity";
import { BudPayAccountConfigService } from "./budpay-account-config.service";
import { PaystackSubaccountImportService } from "./paystack-subaccount-import.service";
import { BudPaySubaccountMigrationService } from "./budpay-subaccount-migration.service";
import { BudPayAdminController } from "./budpay-admin.controller";
import { PaystackAccountConfigService } from "../PAYSTACK_PAYMENT/paystack-account-config.service";

@Module({
  imports: [
    HttpModule.register({ timeout: 30000, maxRedirects: 5 }),
    SequelizeModule.forFeature([User, GuestCheckout, UserCheckout, Store]),
    forwardRef(() => OrderModule),
    forwardRef(() => PaystackModule),
  ],
  controllers: [BudPayController, BudPayAdminController],
  providers: [
    BudPayService,
    BudPayAccountConfigService,
    PaystackAccountConfigService,
    PaystackSubaccountImportService,
    BudPaySubaccountMigrationService,
  ],
  exports: [
    BudPayService,
    BudPayAccountConfigService,
    BudPaySubaccountMigrationService,
  ],
})
export class BudPayModule {}
