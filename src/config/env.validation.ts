import Joi from "joi";

type ValidationResult = {
  warnings: string[];
};

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "staging", "production")
    .default("development"),
  PORT: Joi.number().port().default(8000),
  APP_NAME: Joi.string().trim().default("alaba-market-backend"),
  LOG_LEVEL: Joi.string()
    .valid("fatal", "error", "warn", "info", "debug", "trace", "silent")
    .default("info"),
  LOG_FILE_PATH: Joi.string().trim().optional(),
  LOG_SLOW_REQUEST_MS: Joi.number().integer().min(1).default(1000),
  DATABASE_HOST: Joi.string().trim().required(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USER: Joi.string().trim().required(),
  DATABASE_PASSWORD: Joi.string().allow("").optional(),
  DATABASE_DATABASE: Joi.string().trim().optional(),
  DATABASE: Joi.string().trim().optional(),
  DATABASE_SSL: Joi.boolean().truthy("true").falsy("false").optional(),
  JWT_PRIVATE_KEY: Joi.string().trim().optional(),
  JWT_SECRET: Joi.string().trim().optional(),
  SESSION_EXPIRY: Joi.string().trim().default("7d"),
  PAYSTACK_SECRET_KEY: Joi.string().trim().optional(),
  PAYSTACK_TEST_SECRET_KEY: Joi.string().trim().optional(),
  PAYSTACK_PUBLIC_KEY: Joi.string().trim().optional(),
  PAYSTACK_TEST_PUBLIC_KEY: Joi.string().trim().optional(),
  BUDPAY_SECRET_KEY: Joi.string().trim().optional(),
  BUDPAY_PUBLIC_KEY: Joi.string().trim().optional(),
  BUDPAY_BASE_URL: Joi.string()
    .uri({ allowRelative: false })
    .default("https://api.budpay.com/api/v2"),
  BUDPAY_WEBHOOK_SECRET: Joi.string().trim().optional().allow(""),
  PALMPAY_ENV: Joi.string().valid("sandbox", "production").default("sandbox"),
  PALMPAY_BASE_URL: Joi.string()
    .uri({ allowRelative: false })
    .optional()
    .allow(""),
  PALMPAY_APP_ID: Joi.string().trim().optional().allow(""),
  PALMPAY_MERCHANT_PRIVATE_KEY: Joi.string().trim().optional().allow(""),
  PALMPAY_MERCHANT_PRIVATE_KEY_BASE64: Joi.string()
    .trim()
    .optional()
    .allow(""),
  PALMPAY_MERCHANT_PRIVATE_KEY_FILE: Joi.string()
    .trim()
    .optional()
    .allow(""),
  PALMPAY_PLATFORM_PUBLIC_KEY: Joi.string().trim().optional().allow(""),
  PALMPAY_PLATFORM_PUBLIC_KEY_BASE64: Joi.string()
    .trim()
    .optional()
    .allow(""),
  PALMPAY_PLATFORM_PUBLIC_KEY_FILE: Joi.string()
    .trim()
    .optional()
    .allow(""),
  PALMPAY_COUNTRY_CODE: Joi.string().trim().length(2).default("NG"),
  PALMPAY_NOTIFY_URL: Joi.string()
    .uri({ allowRelative: false })
    .optional()
    .allow(""),
  PALMPAY_CALLBACK_URL: Joi.string()
    .uri({ allowRelative: false })
    .optional()
    .allow(""),
  PAYMENT_PROVIDER: Joi.string()
    .valid("paystack", "budpay", "palmpay")
    .default("paystack"),
  SPLIT_PROVIDER: Joi.string()
    .valid("paystack", "budpay")
    .default("paystack"),
  BUDPAY_ALLOW_COMPANY_FALLBACK: Joi.boolean()
    .truthy("true")
    .falsy("false")
    .default(false),
  FRONTEND_URL: Joi.string().uri({ allowRelative: false }).optional(),
})
  .unknown(true)
  .or("DATABASE_DATABASE", "DATABASE")
  .or("JWT_PRIVATE_KEY", "JWT_SECRET")
  .or("PAYSTACK_SECRET_KEY", "PAYSTACK_TEST_SECRET_KEY")
  .or("PAYSTACK_PUBLIC_KEY", "PAYSTACK_TEST_PUBLIC_KEY");

export function validateEnvironment(): ValidationResult {
  if (!process.env.JWT_PRIVATE_KEY && process.env.JWT_SECRET) {
    process.env.JWT_PRIVATE_KEY = process.env.JWT_SECRET;
  }

  if (!process.env.DATABASE_DATABASE && process.env.DATABASE) {
    process.env.DATABASE_DATABASE = process.env.DATABASE;
  }

  const { error } = envSchema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    const details = error.details.map((detail) => detail.message).join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  const warnings: string[] = [];
  if (!process.env.FRONTEND_URL) {
    warnings.push(
      "FRONTEND_URL is not set; Paystack callback URLs will use service defaults.",
    );
  }

  if (process.env.PALMPAY_APP_ID && !process.env.PALMPAY_NOTIFY_URL) {
    warnings.push(
      "PALMPAY_NOTIFY_URL is not set; PalmPay checkout initialization will fail.",
    );
  }

  return { warnings };
}
