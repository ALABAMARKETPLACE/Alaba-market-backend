import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Order } from "../ORDER/order.entity";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { User } from "../USERS/user.entity";
import { Store } from "../STORE/store.entity";
import { GuestCheckout } from "./guest-checkout.entity";
import { UserCheckout } from "./user-checkout.entity";
import { PaystackReconciliationService } from "./paystack-reconciliation.service";
import { PaystackReconciliationController } from "./paystack-reconciliation.controller";

@Module({
  imports: [
    SequelizeModule.forFeature([
      Order,
      OrderPayments,
      User,
      Store,
      GuestCheckout,
      UserCheckout,
    ]),
  ],
  controllers: [PaystackReconciliationController],
  providers: [PaystackReconciliationService],
  exports: [PaystackReconciliationService],
})
export class PaystackReconciliationModule {}
