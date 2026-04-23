import { afterEach, describe, expect, it } from "@jest/globals";
import { PaystackAccountConfigService } from "./paystack-account-config.service";

describe("PaystackAccountConfigService", () => {
  const service = new PaystackAccountConfigService();

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.PAYSTACK_DEFAULT_ACCOUNT;
    delete process.env.PAYSTACK_USE_NEW_ACCOUNT_AS_DEFAULT;
    delete process.env.PAYSTACK_TEST_SECRET_KEY;
    delete process.env.PAYSTACK_TEST_PUBLIC_KEY;
    delete process.env.PAYSTACK_TEST_SECRET_KEY_OLD;
    delete process.env.PAYSTACK_TEST_PUBLIC_KEY_OLD;
    delete process.env.PAYSTACK_TEST_SECRET_KEY_NEW;
    delete process.env.PAYSTACK_TEST_PUBLIC_KEY_NEW;
  });

  it("uses the new account keys when PAYSTACK_DEFAULT_ACCOUNT is set to new", () => {
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_DEFAULT_ACCOUNT = "new";
    process.env.PAYSTACK_TEST_SECRET_KEY_NEW = "sk_test_new_123";
    process.env.PAYSTACK_TEST_PUBLIC_KEY_NEW = "pk_test_new_123";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_default_123";
    process.env.PAYSTACK_TEST_PUBLIC_KEY = "pk_test_default_123";

    expect(service.getSecretKey()).toBe("sk_test_new_123");
    expect(service.getPublicKey()).toBe("pk_test_new_123");
  });

  it("uses the new account keys when PAYSTACK_USE_NEW_ACCOUNT_AS_DEFAULT is enabled", () => {
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_USE_NEW_ACCOUNT_AS_DEFAULT = "true";
    process.env.PAYSTACK_TEST_SECRET_KEY_NEW = "sk_test_new_flag";
    process.env.PAYSTACK_TEST_PUBLIC_KEY_NEW = "pk_test_new_flag";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_default_flag";
    process.env.PAYSTACK_TEST_PUBLIC_KEY = "pk_test_default_flag";

    expect(service.getSecretKey()).toBe("sk_test_new_flag");
    expect(service.getPublicKey()).toBe("pk_test_new_flag");
  });

  it("keeps explicit old account resolution working when default is new", () => {
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_DEFAULT_ACCOUNT = "new";
    process.env.PAYSTACK_TEST_SECRET_KEY_NEW = "sk_test_new_explicit";
    process.env.PAYSTACK_TEST_PUBLIC_KEY_NEW = "pk_test_new_explicit";
    process.env.PAYSTACK_TEST_SECRET_KEY_OLD = "sk_test_old_explicit";
    process.env.PAYSTACK_TEST_PUBLIC_KEY_OLD = "pk_test_old_explicit";

    expect(service.getSecretKey("old")).toBe("sk_test_old_explicit");
    expect(service.getPublicKey("old")).toBe("pk_test_old_explicit");
    expect(service.getSecretKey("new")).toBe("sk_test_new_explicit");
  });

  it("uses 6.5 percent admin split for the new paystack account by default", () => {
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_DEFAULT_ACCOUNT = "new";
    process.env.PAYSTACK_TEST_SECRET_KEY_NEW = "sk_test_new_split";
    process.env.PAYSTACK_TEST_PUBLIC_KEY_NEW = "pk_test_new_split";

    expect(service.getAdminSplitPercentage()).toBe(6.5);
    expect(service.getSellerSplitPercentage()).toBe(93.5);
    expect(service.getAdminSplitPercentage("old")).toBe(5);
    expect(service.getSellerSplitPercentage("old")).toBe(95);
  });

  it("allows overriding the new account admin split percentage via env", () => {
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_DEFAULT_ACCOUNT = "new";
    process.env.PAYSTACK_TEST_SECRET_KEY_NEW = "sk_test_new_override";
    process.env.PAYSTACK_TEST_PUBLIC_KEY_NEW = "pk_test_new_override";
    process.env.PAYSTACK_ADMIN_SPLIT_PERCENTAGE_NEW = "7.25";

    expect(service.getAdminSplitPercentage()).toBe(7.25);
    expect(service.getSellerSplitPercentage()).toBe(92.75);
  });
});
