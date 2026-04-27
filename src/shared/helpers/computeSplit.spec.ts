import { describe, expect, it } from "@jest/globals";
import computeSplit from "./computeSplit";

describe("computeSplit", () => {
  it("uses a 5 percent admin split by default", () => {
    const result = computeSplit({
      product_total_kobo: 10000,
    });

    expect(result.admin_percentage).toBe(5);
    expect(result.seller_percentage).toBe(95);
    expect(result.admin_amount_kobo).toBe(500);
    expect(result.seller_amount_kobo).toBe(9500);
  });

  it("moves the configured surcharge from seller to admin", () => {
    const result = computeSplit({
      product_total_kobo: 700000,
      admin_percentage: 5,
      seller_fee_surcharge_kobo: 10000,
    });

    expect(result.seller_fee_surcharge_kobo).toBe(10000);
    expect(result.admin_amount_kobo).toBe(45000);
    expect(result.seller_amount_kobo).toBe(655000);
  });
});
