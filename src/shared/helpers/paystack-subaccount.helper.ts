import { Store } from "../../STORE/store.entity";

export type StoreSubaccountSource = "new" | "current" | "old";
export type PaystackAccountType = "default" | "old" | "new";

export interface ResolvedStoreSubaccountSelection {
  code: string;
  source: StoreSubaccountSource;
  paystackAccount: PaystackAccountType;
}

function normalizeSubaccountCode(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

export function resolveStoreSubaccountSelection(
  store?: Partial<Store> | null,
): ResolvedStoreSubaccountSelection | null {
  const newCode = normalizeSubaccountCode(store?.paystack_subaccount_code_new);
  if (newCode) {
    return {
      code: newCode,
      source: "new",
      paystackAccount: "new",
    };
  }

  const currentCode = normalizeSubaccountCode(store?.paystack_subaccount_code);
  if (currentCode) {
    return {
      code: currentCode,
      source: "current",
      paystackAccount: "old",
    };
  }

  const oldCode = normalizeSubaccountCode(store?.paystack_subaccount_code_old);
  if (oldCode) {
    return {
      code: oldCode,
      source: "old",
      paystackAccount: "old",
    };
  }

  return null;
}

export function resolveStoreSubaccountCode(
  store?: Partial<Store> | null,
): string | null {
  return resolveStoreSubaccountSelection(store)?.code ?? null;
}
