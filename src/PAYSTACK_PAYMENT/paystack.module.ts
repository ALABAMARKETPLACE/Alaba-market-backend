import { Module, forwardRef } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PaystackController } from "./paystack.controller";
import { PaystackService } from "./paystack.service";
import { StoreModule } from "../STORE/store.module";
import { PaymentSplitModule } from "../PAYMENT_SPLITS/payment-split.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30 seconds timeout for HTTP requests
      maxRedirects: 5,
    }),
    StoreModule,
    forwardRef(() => PaymentSplitModule),
  ],
  controllers: [PaystackController],
  providers: [PaystackService],
  exports: [PaystackService], // Export service for use in other modules
})
export class PaystackModule {}
