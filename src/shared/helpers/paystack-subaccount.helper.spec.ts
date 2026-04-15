import { describe, expect, it } from "@jest/globals";
import {
  resolveStoreSubaccountCode,
  resolveStoreSubaccountSelection,
} from "./paystack-subaccount.helper";

describe("paystack-subaccount.helper", () => {
  it("resolves the new subaccount code first", () => {
    const store = {
      paystack_subaccount_code_new: "ACCT_NEW_123",
      paystack_subaccount_code: "ACCT_CURRENT_123",
      paystack_subaccount_code_old: "ACCT_OLD_123",
    } as any;

    expect(resolveStoreSubaccountCode(store)).toBe("ACCT_NEW_123");
    expect(resolveStoreSubaccountSelection(store)).toEqual({
      code: "ACCT_NEW_123",
      source: "new",
      paystackAccount: "new",
    });
  });

  it("falls back to the current subaccount code before the old code", () => {
    const store = {
      paystack_subaccount_code_new: null,
      paystack_subaccount_code: "ACCT_CURRENT_123",
      paystack_subaccount_code_old: "ACCT_OLD_123",
    } as any;

    expect(resolveStoreSubaccountCode(store)).toBe("ACCT_CURRENT_123");
    expect(resolveStoreSubaccountSelection(store)?.paystackAccount).toBe("old");
  });

  it("falls back to the old subaccount code when no current code exists", () => {
    const store = {
      paystack_subaccount_code_new: "   ",
      paystack_subaccount_code: null,
      paystack_subaccount_code_old: "ACCT_OLD_123",
    } as any;

    expect(resolveStoreSubaccountCode(store)).toBe("ACCT_OLD_123");
    expect(resolveStoreSubaccountSelection(store)).toEqual({
      code: "ACCT_OLD_123",
      source: "old",
      paystackAccount: "old",
    });
  });

  it("returns null when the store has no usable subaccount code", () => {
    expect(
      resolveStoreSubaccountCode({
        paystack_subaccount_code_new: "",
        paystack_subaccount_code: " ",
        paystack_subaccount_code_old: null,
      } as any),
    ).toBeNull();
  });
});
