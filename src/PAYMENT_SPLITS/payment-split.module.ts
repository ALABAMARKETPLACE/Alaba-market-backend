import { Module, forwardRef } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";

import { PaymentSplitController } from "./payment-split.controller";
import { PaymentSplitService } from "./payment-split.service";

import { PaymentSplit } from "./payment-split.entity";
import { Store } from "../STORE/store.entity";
import { Order } from "../ORDER/order.entity";

import { PaystackModule } from "../PAYSTACK_PAYMENT/paystack.module";

@Module({
  imports: [
    // Register Sequelize models ONLY
    SequelizeModule.forFeature([
      PaymentSplit,
      Store,
      Order,
    ]),

    //Circular dependency with Paystack
    forwardRef(() => PaystackModule),
  ],
  controllers: [PaymentSplitController],
  providers: [PaymentSplitService],
  exports: [PaymentSplitService],
})
export class PaymentSplitModule {}
