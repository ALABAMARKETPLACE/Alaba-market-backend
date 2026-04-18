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
});
