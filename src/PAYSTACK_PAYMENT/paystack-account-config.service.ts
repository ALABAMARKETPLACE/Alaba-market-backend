import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { PaystackAccountType } from "../shared/helpers/paystack-subaccount.helper";

type PaystackKeyType = "public" | "secret";

@Injectable()
export class PaystackAccountConfigService {
  getAdminSplitPercentage(account: PaystackAccountType = "default"): number {
    const effectiveAccount = this.resolveEffectiveAccount(account);
    const envCandidates =
      effectiveAccount === "new"
        ? [
            "PAYSTACK_ADMIN_SPLIT_PERCENTAGE_NEW",
            "PAYSTACK_ADMIN_SPLIT_PERCENTAGE",
          ]
        : effectiveAccount === "old"
          ? [
              "PAYSTACK_ADMIN_SPLIT_PERCENTAGE_OLD",
              "PAYSTACK_ADMIN_SPLIT_PERCENTAGE",
            ]
          : ["PAYSTACK_ADMIN_SPLIT_PERCENTAGE"];

    const configured = this.pickFirstDefined(envCandidates);
    const fallback = effectiveAccount === "new" ? 6.5 : 5.0;

    if (!configured) {
      return fallback;
    }

    const parsed = Number(configured);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 100) {
      throw new InternalServerErrorException(
        `Invalid Paystack admin split percentage for the ${effectiveAccount} account.`,
      );
    }

    return Number(parsed.toFixed(2));
  }

  getSellerSplitPercentage(account: PaystackAccountType = "default"): number {
    return Number((100 - this.getAdminSplitPercentage(account)).toFixed(2));
  }

  getHeaders(account: PaystackAccountType = "default") {
    return {
      Authorization: `Bearer ${this.getSecretKey(account)}`,
      "Content-Type": "application/json",
    };
  }

  getPublicKey(account: PaystackAccountType = "default"): string {
    return this.resolvePaystackKey(account, "public");
  }

  getSecretKey(account: PaystackAccountType = "default"): string {
    return this.resolvePaystackKey(account, "secret");
  }

  getWebhookSecretKeys(): string[] {
    return [...new Set(
      (["default", "old", "new"] as PaystackAccountType[])
        .map((account) => this.tryResolveSecretKey(account))
        .filter((value): value is string => Boolean(value)),
    )];
  }

  getDefaultAccountType(): PaystackAccountType {
    return this.resolveEffectiveAccount("default");
  }

  private tryResolveSecretKey(account: PaystackAccountType): string | null {
    try {
      return this.resolvePaystackKey(account, "secret");
    } catch {
      return null;
    }
  }

  private resolvePaystackKey(
    account: PaystackAccountType,
    type: PaystackKeyType,
  ): string {
    const effectiveAccount = this.resolveEffectiveAccount(account);
    const nodeEnv = (process.env.NODE_ENV || "development").replace(/"/g, "");
    const isDevelopmentLike = nodeEnv !== "production";
    const envName = this.resolveEnvVarName(
      effectiveAccount,
      type,
      isDevelopmentLike,
    );
    const resolvedKey = this.pickFirstDefined(envName);

    if (!resolvedKey) {
      throw new InternalServerErrorException(
        `Missing Paystack ${effectiveAccount} ${type} key configuration.`,
      );
    }

    const expectedTestPrefix = type === "secret" ? "sk_test_" : "pk_test_";

    if (isDevelopmentLike && !resolvedKey.startsWith(expectedTestPrefix)) {
      throw new InternalServerErrorException(
        `Development must use Paystack test ${type} keys for the ${account} account.`,
      );
    }

    return resolvedKey;
  }

  private resolveEffectiveAccount(
    account: PaystackAccountType,
  ): PaystackAccountType {
    if (account !== "default") {
      return account;
    }

    const configuredDefault = String(
      process.env.PAYSTACK_DEFAULT_ACCOUNT || "",
    )
      .trim()
      .toLowerCase();

    if (configuredDefault === "new") {
      return "new";
    }

    if (configuredDefault === "old") {
      return "old";
    }

    const useNewAccountAsDefault = String(
      process.env.PAYSTACK_USE_NEW_ACCOUNT_AS_DEFAULT || "",
    )
      .trim()
      .toLowerCase();

    if (["true", "1", "yes", "on"].includes(useNewAccountAsDefault)) {
      return "new";
    }

    return "default";
  }

  private resolveEnvVarName(
    account: PaystackAccountType,
    type: PaystackKeyType,
    isDevelopmentLike: boolean,
  ): string[] {
    const baseName = type === "secret" ? "SECRET" : "PUBLIC";
    const testName = `PAYSTACK_TEST_${baseName}_KEY`;
    const liveName = `PAYSTACK_${baseName}_KEY`;

    if (account === "new") {
      return isDevelopmentLike
        ? [`PAYSTACK_TEST_${baseName}_KEY_NEW`, `PAYSTACK_${baseName}_KEY_NEW`]
        : [`PAYSTACK_${baseName}_KEY_NEW`, `PAYSTACK_TEST_${baseName}_KEY_NEW`];
    }

    if (account === "old") {
      return isDevelopmentLike
        ? [
            `PAYSTACK_TEST_${baseName}_KEY_OLD`,
            testName,
            `PAYSTACK_${baseName}_KEY_OLD`,
            liveName,
          ]
        : [
            `PAYSTACK_${baseName}_KEY_OLD`,
            liveName,
            `PAYSTACK_TEST_${baseName}_KEY_OLD`,
            testName,
          ];
    }

    return isDevelopmentLike
      ? [testName, liveName]
      : [liveName, testName];
  }

  private pickFirstDefined(envNames: string[]): string | null {
    for (const envName of envNames) {
      const value = process.env[envName];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }
}
