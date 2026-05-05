import { BoostedProduct } from "./boosted-product.entity";
import { BoosterPlanConfig } from "./booster-plan-config.entity";
import { SellerBoosterPlan } from "./seller-booster-plan.entity";

export const SellerBoosterProviders = [
  { provide: "SellerBoosterPlanRepository", useValue: SellerBoosterPlan },
  { provide: "BoostedProductRepository", useValue: BoostedProduct },
  { provide: "BoosterPlanConfigRepository", useValue: BoosterPlanConfig },
];
