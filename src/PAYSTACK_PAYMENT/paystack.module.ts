import { Module, forwardRef } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SequelizeModule } from "@nestjs/sequelize";

import { PaystackController } from "./paystack.controller";
import { PaystackService } from "./paystack.service";

import { Store } from "../STORE/store.entity";
import { StoreModule } from "../STORE/store.module";
import { PaymentSplitModule } from "../PAYMENT_SPLITS/payment-split.module";
import { GuestCheckout } from "./guest-checkout.entity";
import { OrderModule } from "../ORDER/order.module";

@Module({
  imports: [
    // HTTP client for Paystack API
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),

    // Sequelize model needed by PaystackService
    SequelizeModule.forFeature([Store, GuestCheckout]),

    // StoreModule (non-circular)
    StoreModule,

    // Circular dependency handled correctly
    forwardRef(() => PaymentSplitModule),
    forwardRef(() => OrderModule),
  ],
  controllers: [PaystackController],
  providers: [PaystackService],

  // REQUIRED so PaymentSplitModule can inject PaystackService
  exports: [PaystackService],
})
export class PaystackModule {}
