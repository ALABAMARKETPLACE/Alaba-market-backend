import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PaystackService } from "./paystack.service";
import { PaystackController } from "./paystack.controller";

@Module({
  imports: [
    HttpModule.register({ timeout: 30000, maxRedirects: 5 }),
  ],
  controllers: [PaystackController],
  providers: [PaystackService],
  exports: [PaystackService],
})
export class PaystackModule {}
