import { BadRequestException, Injectable } from "@nestjs/common";
import * as crypto from "crypto";

import { PalmPayConfigService } from "./palmpay-config.service";

@Injectable()
export class PalmPaySignatureService {
  constructor(private readonly config: PalmPayConfigService) {}

  sign(payload: Record<string, any>): string {
    const digest = this.createDigest(payload);
    return crypto
      .sign("RSA-SHA1", Buffer.from(digest, "utf8"), {
        key: this.normalizePrivateKey(this.config.getMerchantPrivateKey()),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      })
      .toString("base64");
  }

  verifyCallback(payload: Record<string, any>): boolean {
    const encodedSignature = String(payload?.sign || "").trim();
    if (!encodedSignature) {
      return false;
    }

    const unsignedPayload = { ...payload };
    delete unsignedPayload.sign;

    let signature: string;
    try {
      signature = decodeURIComponent(encodedSignature).replace(/ /g, "+");
    } catch {
      signature = encodedSignature.replace(/ /g, "+");
    }

    try {
      return crypto.verify(
        "RSA-SHA1",
        Buffer.from(this.createDigest(unsignedPayload), "utf8"),
        {
          key: this.normalizePublicKey(this.config.getPlatformPublicKey()),
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(signature, "base64")
      );
    } catch {
      return false;
    }
  }

  createCanonicalString(payload: Record<string, any>): string {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestException(
        "PalmPay signature payload must be an object"
      );
    }

    return Object.keys(payload)
      .filter((key) => this.hasValue(payload[key]))
      .sort()
      .map((key) => `${key}=${this.normalizeValue(payload[key])}`)
      .join("&");
  }

  private createDigest(payload: Record<string, any>): string {
    return crypto
      .createHash("md5")
      .update(this.createCanonicalString(payload), "utf8")
      .digest("hex")
      .toUpperCase();
  }

  private hasValue(value: any): boolean {
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  private normalizeValue(value: any): string {
    if (typeof value === "string") {
      return value.trim();
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private normalizePrivateKey(value: string): string {
    const normalized = value.replace(/\\n/g, "\n").trim();
    if (normalized.includes("BEGIN")) {
      return normalized;
    }

    return this.wrapPem(normalized, "PRIVATE KEY");
  }

  private normalizePublicKey(value: string): string {
    const normalized = value.replace(/\\n/g, "\n").trim();
    if (normalized.includes("BEGIN")) {
      return normalized;
    }

    return this.wrapPem(normalized, "PUBLIC KEY");
  }

  private wrapPem(value: string, label: string): string {
    const body =
      value
        .replace(/\s+/g, "")
        .match(/.{1,64}/g)
        ?.join("\n") || "";
    return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
  }
}
