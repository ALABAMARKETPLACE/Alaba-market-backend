import { forwardRef, Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SequelizeModule } from "@nestjs/sequelize";

import { User } from "../USERS/user.entity";
import { GuestCheckout } from "../PAYSTACK_PAYMENT/guest-checkout.entity";
import { UserCheckout } from "../PAYSTACK_PAYMENT/user-checkout.entity";
import { OrderModule } from "../ORDER/order.module";
import { PaystackModule } from "../PAYSTACK_PAYMENT/paystack.module";
import { PalmPayController } from "./palmpay.controller";
import { PalmPayConfigService } from "./palmpay-config.service";
import { PalmPayService } from "./palmpay.service";
import { PalmPaySignatureService } from "./palmpay-signature.service";

@Module({
  imports: [
    HttpModule.register({ timeout: 30000, maxRedirects: 5 }),
    SequelizeModule.forFeature([User, GuestCheckout, UserCheckout]),
    forwardRef(() => OrderModule),
    forwardRef(() => PaystackModule),
  ],
  controllers: [PalmPayController],
  providers: [PalmPayConfigService, PalmPaySignatureService, PalmPayService],
  exports: [PalmPayConfigService, PalmPaySignatureService, PalmPayService],
})
export class PalmPayModule {}
