import { Module } from "@nestjs/common";
import { SubscriptionPlanController } from "./subscription-plan.controller";
import { SubscriptionPlanService } from "./subscription-plan.service";
import { SubscriptionPlanProvider } from "./subscription-plan.provider";

@Module({
  imports: [],
  controllers: [SubscriptionPlanController],
  providers: [SubscriptionPlanService, ...SubscriptionPlanProvider],
  exports: [SubscriptionPlanService, ...SubscriptionPlanProvider],
})
export class SubscriptionPlanModule {}
