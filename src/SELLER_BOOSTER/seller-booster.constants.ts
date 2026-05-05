export const SELLER_BOOSTER_CHECKOUT_TYPE = "seller_booster";

export type SellerBoosterTier = "basic" | "gold" | "premium";
export type SellerBoosterPlanStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "pending";
export type BoostedProductStatus = "active" | "expired" | "cancelled";

export type SellerBoosterTierConfig = {
  tier: SellerBoosterTier;
  displayName: string;
  productLimit: number | null;
  defaultDurationDays: number;
  monthlyAmountKobo: number;
  description: string;
  boostScore: number;
};

const numberFromEnv = (key: string, fallback: number): number => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : fallback;
};

export const SELLER_BOOSTER_TIERS: Record<
  SellerBoosterTier,
  SellerBoosterTierConfig
> = {
  basic: {
    tier: "basic",
    displayName: "Basic",
    productLimit: 5,
    defaultDurationDays: 30,
    monthlyAmountKobo: numberFromEnv("SELLER_BOOSTER_BASIC_AMOUNT_KOBO", 500000),
    description: "Boost up to 5 selected active products.",
    boostScore: 30,
  },
  gold: {
    tier: "gold",
    displayName: "Gold",
    productLimit: 20,
    defaultDurationDays: 30,
    monthlyAmountKobo: numberFromEnv("SELLER_BOOSTER_GOLD_AMOUNT_KOBO", 1500000),
    description: "Boost up to 20 selected active products.",
    boostScore: 60,
  },
  premium: {
    tier: "premium",
    displayName: "Premium",
    productLimit: null,
    defaultDurationDays: 30,
    monthlyAmountKobo: numberFromEnv(
      "SELLER_BOOSTER_PREMIUM_AMOUNT_KOBO",
      5000000,
    ),
    description: "Boost all active products in your store.",
    boostScore: 100,
  },
};

export const DEFAULT_SELLER_BOOSTER_PLAN_CONFIGS = Object.values(
  SELLER_BOOSTER_TIERS,
).map((config) => ({
  name: config.tier,
  display_name: config.displayName,
  description: config.description,
  product_limit: config.productLimit,
  boost_score: config.boostScore,
  duration_days: config.defaultDurationDays,
  price: config.monthlyAmountKobo,
  currency: "NGN",
  is_active: true,
  is_unlimited: config.productLimit === null,
}));
