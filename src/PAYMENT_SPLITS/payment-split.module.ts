import { Module, forwardRef } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PaymentSplitController } from "./payment-split.controller";
import { PaymentSplitService } from "./payment-split.service";
import { paymentSplitProviders } from "./payment-split.providers";
import { StoreModule } from "../STORE/store.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    StoreModule,
  ],
  controllers: [PaymentSplitController],
  providers: [PaymentSplitService, ...paymentSplitProviders],
  exports: [PaymentSplitService, ...paymentSplitProviders],
})
export class PaymentSplitModule {}