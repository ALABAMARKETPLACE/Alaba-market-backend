import { Module } from "@nestjs/common";
import { StoreReviewController } from "./storereview.controller";
import { StoreReviewService } from "./storereview.service";
import { StoreReviewProvider } from "./storereview.provider";

@Module({
  imports: [],
  controllers: [StoreReviewController],
  providers: [StoreReviewService, ...StoreReviewProvider],
  exports: [StoreReviewService],
})
export class StoreReviewModule {}
