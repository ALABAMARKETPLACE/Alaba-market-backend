import { Module } from "@nestjs/common";
import { FeaturedProductsController } from "./featured-products.controller";
import { FeaturedProductsService } from "./featured-products.service";
import { FeaturedRotationProviders } from "./featured-rotation.provider";
import { FeaturedRotationScheduler } from "./featured-rotation.scheduler";
import { BoostRequestModule } from "../BOOST_REQUESTS/boost-request.module";
import { ProductsModule } from "../PRODUCTS/products.module";
import { SubscriptionPlanModule } from "../SUBSCRIPTION_PLANS/subscription-plan.module";
import { StoreModule } from "../STORE/store.module";
import { ProductVariantModule } from "../PRODUCT_VARIANTS/productvariant.module";

@Module({
  imports: [
    BoostRequestModule,
    ProductsModule,
    SubscriptionPlanModule,
    StoreModule,
    ProductVariantModule,
  ],
  controllers: [FeaturedProductsController],
  providers: [FeaturedProductsService, FeaturedRotationScheduler, ...FeaturedRotationProviders],
  exports: [FeaturedProductsService, FeaturedRotationScheduler, ...FeaturedRotationProviders],
})
export class FeaturedProductsModule {}
