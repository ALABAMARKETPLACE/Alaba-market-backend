import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { PaystackSubaccountController } from "./paystack-subaccount.controller";
import { PaystackSubaccountService } from "./paystack-subaccount.service";
// import { paystackSubaccountProviders } from "./paystack-subaccount.providers";
import { HttpModule } from "@nestjs/axios";
// import { StoreProvider } from "../STORE/store.provider";
import { PaystackSubaccount } from "./paystack-subaccount.entity";
import { Store } from "../STORE/store.entity";

@Module({
  imports: [
    HttpModule,
    SequelizeModule.forFeature([PaystackSubaccount, Store]),
  ],
  controllers: [PaystackSubaccountController],
  providers: [
    PaystackSubaccountService],
  exports: [PaystackSubaccountService],
})
export class PaystackSubaccountModule {}

