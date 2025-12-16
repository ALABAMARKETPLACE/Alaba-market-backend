import { Module } from "@nestjs/common";
import { PaystackSubaccountController } from "./paystack-subaccount.controller";
import { PaystackSubaccountService } from "./paystack-subaccount.service";
import { paystackSubaccountProviders } from "./paystack-subaccount.providers";
import { HttpModule } from "@nestjs/axios";
import { StoreProvider } from "../STORE/store.provider";

@Module({
  imports: [HttpModule],
  controllers: [PaystackSubaccountController],
  providers: [
    PaystackSubaccountService, 
    ...paystackSubaccountProviders,
    ...StoreProvider
  ],
  exports: [PaystackSubaccountService, ...paystackSubaccountProviders],
})
export class PaystackSubaccountModule {}