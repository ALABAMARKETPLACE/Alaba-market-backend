import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

import { PaystackAccountConfigService } from "../PAYSTACK_PAYMENT/paystack-account-config.service";

type PaystackAccount = "default" | "old" | "new";

@Injectable()
export class PaystackSubaccountImportService {
  private readonly baseUrl = "https://api.paystack.co";

  constructor(
    private readonly httpService: HttpService,
    private readonly paystackAccountConfigService: PaystackAccountConfigService,
  ) {}

  async fetchSubaccount(
    idOrCode: string | number,
  ): Promise<Record<string, any> | null> {
    let lastError: unknown;

    for (const account of ["new", "old", "default"] as PaystackAccount[]) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(
            `${this.baseUrl}/subaccount/${encodeURIComponent(String(idOrCode))}`,
            {
              headers: this.paystackAccountConfigService.getHeaders(account),
            },
          ),
        );
        if (response?.data?.status && response?.data?.data) {
          return {
            ...response.data.data,
            paystack_account: account,
          };
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      return null;
    }
    return null;
  }

  async listSubaccounts(options: {
    page?: number;
    perPage?: number;
    account?: PaystackAccount;
  } = {}): Promise<any> {
    const account = options.account || "default";
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/subaccount`, {
        headers: this.paystackAccountConfigService.getHeaders(account),
        params: {
          page: Math.max(Number(options.page || 1), 1),
          perPage: Math.min(Math.max(Number(options.perPage || 100), 1), 100),
        },
      }),
    );
    return response.data;
  }
}
