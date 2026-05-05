import { Module, forwardRef } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { PaystackModule } from "../PAYSTACK_PAYMENT/paystack.module";
import { Products } from "../PRODUCTS/products.entity";
import { ProductsProviders } from "../PRODUCTS/products.provider";
import { Store } from "../STORE/store.entity";
import { StoreProvider } from "../STORE/store.provider";
import { User } from "../USERS/user.entity";
import { BoostedProduct } from "./boosted-product.entity";
import { BoosterPlanConfig } from "./booster-plan-config.entity";
import { SellerBoosterController } from "./seller-booster.controller";
import { SellerBoosterPlan } from "./seller-booster-plan.entity";
import { SellerBoosterProviders } from "./seller-booster.provider";
import { SellerBoosterService } from "./seller-booster.service";

@Module({
  imports: [
    SequelizeModule.forFeature([
      SellerBoosterPlan,
      BoostedProduct,
      BoosterPlanConfig,
      Products,
      Store,
      User,
    ]),
    forwardRef(() => PaystackModule),
  ],
  controllers: [SellerBoosterController],
  providers: [
    SellerBoosterService,
    ...SellerBoosterProviders,
    ...ProductsProviders,
    ...StoreProvider,
    { provide: "UserRepository", useValue: User },
  ],
  exports: [SellerBoosterService, ...SellerBoosterProviders],
})
export class SellerBoosterModule {}
