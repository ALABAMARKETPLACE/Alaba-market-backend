import { validateEnvironment } from "./env.validation";

describe("validateEnvironment", () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    process.env = {
      NODE_ENV: "test",
      DATABASE_HOST: "localhost",
      DATABASE_USER: "test",
      DATABASE_DATABASE: "test",
      JWT_SECRET: "test-secret",
      PAYSTACK_TEST_SECRET_KEY: "sk_test_placeholder",
      PAYSTACK_TEST_PUBLIC_KEY: "pk_test_placeholder",
      PALMPAY_APP_ID: "",
      PALMPAY_MERCHANT_PRIVATE_KEY_BASE64: "",
      PALMPAY_MERCHANT_PRIVATE_KEY_FILE: "",
      PALMPAY_PLATFORM_PUBLIC_KEY_BASE64: "",
      PALMPAY_PLATFORM_PUBLIC_KEY_FILE: "",
      PALMPAY_NOTIFY_URL: "",
      PALMPAY_CALLBACK_URL: "",
    };
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it("allows optional PalmPay settings to remain empty", () => {
    expect(() => validateEnvironment()).not.toThrow();
  });
});
