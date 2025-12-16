import { Module } from "@nestjs/common";
import { ProductReviewsService } from "./prod_rev.services";
import { ProductReviewsProviders } from "./prod_rev.provider";
import { ProductReviewsController } from "./prod_rev.controller";
@Module({
  imports: [],
  controllers: [ProductReviewsController],
  providers: [ProductReviewsService, ...ProductReviewsProviders],
  exports: [ProductReviewsService],
})
export class ProductReviewsModule {}
