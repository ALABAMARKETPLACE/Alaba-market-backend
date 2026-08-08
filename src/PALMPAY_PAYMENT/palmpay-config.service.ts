import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { readFileSync } from "fs";
import { resolve } from "path";

@Injectable()
export class PalmPayConfigService {
  getBaseUrl(): string {
    const configured = process.env.PALMPAY_BASE_URL?.trim();
    if (configured) {
      return configured.replace(/\/$/, "");
    }

    return process.env.PALMPAY_ENV?.toLowerCase() === "production"
      ? "https://open-gw-prod.palmpay-inc.com"
      : "https://open-gw-sandbox.palmpay-inc.com";
  }

  getAppId(): string {
    return this.requireValue("PALMPAY_APP_ID");
  }

  getMerchantPrivateKey(): string {
    return this.requireKey(
      ["PALMPAY_MERCHANT_PRIVATE_KEY", "PALMPAY_MERCHANT_PRIVATE_KEY_BASE64"],
      "PALMPAY_MERCHANT_PRIVATE_KEY_FILE"
    );
  }

  getPlatformPublicKey(): string {
    return this.requireKey(
      ["PALMPAY_PLATFORM_PUBLIC_KEY", "PALMPAY_PLATFORM_PUBLIC_KEY_BASE64"],
      "PALMPAY_PLATFORM_PUBLIC_KEY_FILE"
    );
  }

  getCountryCode(): string {
    return (process.env.PALMPAY_COUNTRY_CODE || "NG").trim().toUpperCase();
  }

  getNotifyUrl(): string {
    return this.validateUrl(
      this.requireValue("PALMPAY_NOTIFY_URL"),
      "PALMPAY_NOTIFY_URL"
    );
  }

  getCallbackUrl(callbackUrl?: string): string {
    const value =
      callbackUrl?.trim() ||
      process.env.PALMPAY_CALLBACK_URL?.trim() ||
      (process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL.replace(/\/$/, "")}/payment/callback`
        : "");

    if (!value) {
      throw new ServiceUnavailableException(
        "PALMPAY_CALLBACK_URL or FRONTEND_URL is not configured"
      );
    }

    return this.validateUrl(value, "PalmPay callback URL");
  }

  private requireValue(...names: string[]): string {
    for (const name of names) {
      const value = process.env[name]?.trim();
      if (value) {
        return value;
      }
    }

    throw new ServiceUnavailableException(
      `${names.join(" or ")} is not configured`
    );
  }

  private requireKey(valueNames: string[], fileName: string): string {
    for (const name of valueNames) {
      const value = process.env[name]?.trim();
      if (value) {
        return value;
      }
    }

    const configuredPath = process.env[fileName]?.trim();
    if (configuredPath) {
      try {
        const value = readFileSync(resolve(configuredPath), "utf8").trim();
        if (value) {
          return value;
        }
      } catch {
        throw new ServiceUnavailableException(
          `${fileName} does not point to a readable key file`
        );
      }
    }

    throw new ServiceUnavailableException(
      `${valueNames.join(" or ")} or ${fileName} is not configured`
    );
  }

  private validateUrl(value: string, label: string): string {
    try {
      const parsed = new URL(value);
      if (
        !["http:", "https:"].includes(parsed.protocol) ||
        value.length > 200
      ) {
        throw new Error("unsupported URL");
      }
    } catch {
      throw new ServiceUnavailableException(
        `${label} must be an absolute HTTP(S) URL no longer than 200 characters`
      );
    }

    return value;
  }
}
