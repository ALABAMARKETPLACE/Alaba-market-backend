import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SequelizeModule } from "@nestjs/sequelize";
import { PaymentSplitController } from "./payment-split.controller";
import { PaymentSplitService } from "./payment-split.service";
import { PaymentSplit } from "./payment-split.entity";
import { Store } from "../STORE/store.entity";
import { Order } from "../ORDER/order.entity";
import { StoreModule } from "../STORE/store.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    SequelizeModule.forFeature([
      PaymentSplit,
      Store,
      Order,
    ]),
    StoreModule,
  ],
  controllers: [PaymentSplitController],
  providers: [PaymentSplitService],
  exports: [PaymentSplitService],
})
export class PaymentSplitModule {}
