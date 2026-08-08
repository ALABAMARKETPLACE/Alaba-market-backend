import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import * as crypto from "crypto";

import { PalmPayConfigService } from "./palmpay-config.service";
import { PalmPaySignatureService } from "./palmpay-signature.service";

describe("PalmPaySignatureService", () => {
  let service: PalmPaySignatureService;
  let privateKey: string;
  let publicKey: string;

  beforeEach(() => {
    const pair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    privateKey = pair.privateKey;
    publicKey = pair.publicKey;
    process.env.PALMPAY_MERCHANT_PRIVATE_KEY = privateKey;
    process.env.PALMPAY_PLATFORM_PUBLIC_KEY = publicKey;
    service = new PalmPaySignatureService(new PalmPayConfigService());
  });

  afterEach(() => {
    delete process.env.PALMPAY_MERCHANT_PRIVATE_KEY;
    delete process.env.PALMPAY_PLATFORM_PUBLIC_KEY;
  });

  it("sorts fields, trims values, and omits empty values", () => {
    expect(
      service.createCanonicalString({
        version: "V1.1",
        empty: " ",
        amount: 200,
        nonceStr: " nonce ",
        ignored: null,
      })
    ).toBe("amount=200&nonceStr=nonce&version=V1.1");
  });

  it("generates a SHA1WithRSA signature over the uppercase MD5 digest", () => {
    const payload = {
      requestTime: 1546857549088,
      version: "V2.0",
      nonceStr: "tXIUBaQUUip97xhymcgvndYo6oSAvQXP",
      orderId: "e7c3784d5e2242fc00afe89ac12399",
    };
    const signature = service.sign(payload);
    const digest = crypto
      .createHash("md5")
      .update(service.createCanonicalString(payload))
      .digest("hex")
      .toUpperCase();

    expect(
      crypto.verify(
        "RSA-SHA1",
        Buffer.from(digest),
        publicKey,
        Buffer.from(signature, "base64")
      )
    ).toBe(true);
  });

  it("verifies URL-encoded PalmPay callback signatures", () => {
    const callback: Record<string, any> = {
      orderId: "PPU123",
      orderNo: "2424231018025438544222",
      appId: "L123",
      amount: 150000,
      currency: "NGN",
      orderStatus: 2,
    };
    callback.sign = encodeURIComponent(service.sign(callback));

    expect(service.verifyCallback(callback)).toBe(true);
  });

  it("accepts headerless Base64 keys from deployment secrets", () => {
    process.env.PALMPAY_MERCHANT_PRIVATE_KEY = privateKey
      .replace(/-----[^-]+-----/g, "")
      .replace(/\s+/g, "");
    process.env.PALMPAY_PLATFORM_PUBLIC_KEY = publicKey
      .replace(/-----[^-]+-----/g, "")
      .replace(/\s+/g, "");
    const base64KeyService = new PalmPaySignatureService(
      new PalmPayConfigService()
    );
    const callback: Record<string, any> = {
      orderId: "PPU123",
      amount: 150000,
      orderStatus: 2,
    };
    callback.sign = base64KeyService.sign(callback);

    expect(base64KeyService.verifyCallback(callback)).toBe(true);
  });
});
