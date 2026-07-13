import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

@Injectable()
export class BudPayAccountConfigService {
  getBaseUrl(): string {
    return (
      process.env.BUDPAY_BASE_URL || "https://api.budpay.com/api/v2"
    ).replace(/\/+$/, "");
  }

  getSecretKey(): string {
    const secretKey = process.env.BUDPAY_SECRET_KEY;
    if (!secretKey) {
      throw new HttpException(
        "BUDPAY_SECRET_KEY is not configured",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return secretKey;
  }

  getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getSecretKey()}`,
      "Content-Type": "application/json",
    };
  }
}
