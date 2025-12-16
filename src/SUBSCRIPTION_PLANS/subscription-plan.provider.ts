import { SubscriptionPlan } from "./subscription-plan.entity";

export const SubscriptionPlanProvider = [
  { provide: "SubscriptionPlanRepository", useValue: SubscriptionPlan },
];
