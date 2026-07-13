import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/sequelize";
import { firstValueFrom } from "rxjs";
import { Op } from "sequelize";

import { Store } from "../STORE/store.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { BudPayAccountConfigService } from "./budpay-account-config.service";
import { PaystackSubaccountImportService } from "./paystack-subaccount-import.service";
import {
  BudPayImportStatusQueryDto,
  BudPaySubaccountImportDto,
} from "./dto/budpay-subaccount-import.dto";

type ImportResult = {
  store_id: number;
  store_name: string;
  result: "ready" | "preview" | "success" | "failed" | "skipped";
  reason?: string;
  missing_fields?: string[];
  payout_profile?: Record<string, any>;
  budpay?: Record<string, any>;
};

type SellerProfile = {
  business_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  paystack_subaccount_code: string;
};

@Injectable()
export class BudPaySubaccountMigrationService {
  private readonly logger = new Logger(BudPaySubaccountMigrationService.name);

  constructor(
    @InjectModel(Store)
    private readonly storeRepository: typeof Store,
    private readonly httpService: HttpService,
    private readonly budPayAccountConfigService: BudPayAccountConfigService,
    private readonly paystackSubaccountImportService: PaystackSubaccountImportService,
  ) {}

  private eligibleWhere(storeId?: number): Record<string, any> {
    const where: Record<string, any> = {
      subaccount_status: "active",
      [Op.or]: [
        { paystack_subaccount_code_new: { [Op.ne]: null } },
        { paystack_subaccount_code: { [Op.ne]: null } },
        { paystack_subaccount_code_old: { [Op.ne]: null } },
        { paystack_subaccount_id: { [Op.ne]: null } },
      ],
    };
    if (storeId) {
      where.id = storeId;
    }
    return where;
  }

  private storeName(store: Store): string {
    return (
      store.business_name ||
      store.store_name ||
      store.name ||
      `Store ${store.id}`
    ).trim();
  }

  private paystackReference(store: Store): string | number | null {
    return (
      store.paystack_subaccount_code_new ||
      store.paystack_subaccount_code ||
      store.paystack_subaccount_code_old ||
      store.paystack_subaccount_id ||
      null
    );
  }

  private splitName(store: Store): { first_name: string; last_name: string } {
    const explicitFirst = String(store.first_name || "").trim();
    const explicitLast = String(store.last_name || "").trim();
    if (explicitFirst && explicitLast) {
      return { first_name: explicitFirst, last_name: explicitLast };
    }

    const fullName = String(
      store.primary_contact_name || store.seller_name || store.name || "",
    ).trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    return {
      first_name: explicitFirst || parts[0] || this.storeName(store),
      last_name:
        explicitLast ||
        (parts.length > 1 ? parts.slice(1).join(" ") : "Seller"),
    };
  }

  private normalizePaystackDetails(details: any): Partial<SellerProfile> {
    const settlementBank = details?.settlement_bank;
    return {
      bank_code: String(
        settlementBank?.code ||
          settlementBank?.bank_code ||
          details?.bank_code ||
          (typeof settlementBank === "string" ? settlementBank : "") ||
          "",
      ).trim(),
      bank_name: String(
        settlementBank?.name ||
          settlementBank?.bank_name ||
          details?.bank_name ||
          "",
      ).trim(),
      account_number: String(details?.account_number || "").trim(),
      account_name: String(details?.account_name || "").trim(),
      business_name: String(details?.business_name || "").trim(),
      email: String(details?.primary_contact_email || "").trim(),
      phone: String(details?.primary_contact_phone || "").trim(),
      paystack_subaccount_code: String(
        details?.subaccount_code || "",
      ).trim(),
    };
  }

  private buildProfile(
    store: Store,
    paystackDetails?: Record<string, any> | null,
  ): SellerProfile {
    const remote = this.normalizePaystackDetails(paystackDetails);
    const name = this.splitName(store);
    const localSettlementBank = String(store.settlement_bank || "").trim();

    return {
      business_name: remote.business_name || this.storeName(store),
      first_name: name.first_name,
      last_name: name.last_name,
      email: String(
        store.primary_contact_email || store.email || remote.email || "",
      )
        .trim()
        .toLowerCase(),
      phone: String(
        store.primary_contact_phone || store.phone || remote.phone || "",
      ).trim(),
      bank_code: remote.bank_code || localSettlementBank,
      bank_name: remote.bank_name || localSettlementBank,
      account_number: String(
        store.settlement_account_number ||
          store.account_number ||
          remote.account_number ||
          "",
      ).trim(),
      account_name: String(
        store.settlement_account_name ||
          store.account_name_or_code ||
          remote.account_name ||
          "",
      ).trim(),
      paystack_subaccount_code: String(
        remote.paystack_subaccount_code ||
          this.paystackReference(store) ||
          "",
      ).trim(),
    };
  }

  private missingFields(profile: SellerProfile): string[] {
    return [
      ["email", profile.email],
      ["phone", profile.phone],
      ["bank_code", profile.bank_code],
      ["bank_name", profile.bank_name],
      ["account_number", profile.account_number],
      ["account_name", profile.account_name],
    ]
      .filter(([, value]) => !value)
      .map(([field]) => field);
  }

  private isImported(store: Store): boolean {
    return Boolean(
        store.budpay_subaccount_id ||
        store.budpay_customer_id ||
        store.budpay_virtual_account_id ||
        store.budpay_account_number,
    );
  }

  private formatStore(
    store: Store,
    result: ImportResult["result"],
    extras: Partial<ImportResult> = {},
  ): ImportResult {
    return {
      store_id: Number(store.id),
      store_name: this.storeName(store),
      result,
      ...extras,
    };
  }

  private async resolveProfile(
    store: Store,
  ): Promise<{ profile: SellerProfile; paystackDetails: any | null }> {
    let profile = this.buildProfile(store);
    let paystackDetails: any | null = null;

    const reference = this.paystackReference(store);
    if (reference) {
      paystackDetails =
        await this.paystackSubaccountImportService.fetchSubaccount(reference);
      profile = this.buildProfile(store, paystackDetails);
    }

    return { profile, paystackDetails };
  }

  private async listBudPayVirtualAccounts(): Promise<any[]> {
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.budPayAccountConfigService.getBaseUrl()}/list_dedicated_accounts`,
        { headers: this.budPayAccountConfigService.getHeaders() },
      ),
    );
    if (!response?.data?.status) {
      throw new Error(
        response?.data?.message || "Unable to list BudPay virtual accounts",
      );
    }
    return Array.isArray(response?.data?.data) ? response.data.data : [];
  }

  private findExistingVirtualAccount(accounts: any[], email: string): any {
    const normalizedEmail = email.trim().toLowerCase();
    return accounts.find(
      (entry) =>
        String(entry?.customer?.email || "")
          .trim()
          .toLowerCase() === normalizedEmail,
    );
  }

  private async createBudPayProfile(
    storeId: number,
    profile: SellerProfile,
  ): Promise<{
    customerResponse: any;
    virtualAccountResponse: any;
    reused: boolean;
  }> {
    const accounts = await this.listBudPayVirtualAccounts();
    const existing = this.findExistingVirtualAccount(accounts, profile.email);
    if (existing) {
      return {
        customerResponse: { status: true, data: existing.customer },
        virtualAccountResponse: { status: true, data: existing },
        reused: true,
      };
    }

    const customerResponse = await firstValueFrom(
      this.httpService.post(
        `${this.budPayAccountConfigService.getBaseUrl()}/customer`,
        {
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          metadata: {
            alaba_store_reference: `alaba_store_${storeId}`,
            business_name: profile.business_name,
            source_paystack_subaccount_code:
              profile.paystack_subaccount_code,
          },
        },
        { headers: this.budPayAccountConfigService.getHeaders() },
      ),
    );
    if (!customerResponse?.data?.status || !customerResponse?.data?.data) {
      throw new Error(
        customerResponse?.data?.message || "BudPay customer creation failed",
      );
    }

    const customerCode = customerResponse.data.data.customer_code;
    const virtualAccountResponse = await firstValueFrom(
      this.httpService.post(
        `${this.budPayAccountConfigService.getBaseUrl()}/dedicated_virtual_account`,
        { customer: customerCode },
        { headers: this.budPayAccountConfigService.getHeaders() },
      ),
    );
    if (
      !virtualAccountResponse?.data?.status ||
      !virtualAccountResponse?.data?.data
    ) {
      throw new Error(
        virtualAccountResponse?.data?.message ||
          "BudPay virtual account creation failed",
      );
    }

    return {
      customerResponse: customerResponse.data,
      virtualAccountResponse: virtualAccountResponse.data,
      reused: false,
    };
  }

  private extractBudPayFields(created: {
    customerResponse: any;
    virtualAccountResponse: any;
  }) {
    const customer =
      created.virtualAccountResponse?.data?.customer ||
      created.customerResponse?.data ||
      {};
    const virtualAccount = created.virtualAccountResponse?.data || {};
    return {
      customerId: customer.id || null,
      customerCode: customer.customer_code || null,
      virtualAccountId: virtualAccount.id || null,
      accountNumber:
        virtualAccount.account_number == null
          ? null
          : String(virtualAccount.account_number),
      bankName:
        virtualAccount.bank?.name ||
        virtualAccount.bank ||
        virtualAccount.provider?.bank_name ||
        null,
    };
  }

  async preview(
    options: BudPaySubaccountImportDto = {},
  ): Promise<DataResponseDto> {
    const stores = await this.storeRepository.findAll({
      where: this.eligibleWhere(options.storeId),
      order: [["id", "ASC"]],
      limit: Math.min(Math.max(Number(options.limit || 500), 1), 1000),
    });
    const results: ImportResult[] = [];

    for (const store of stores) {
      if (this.isImported(store)) {
        results.push(
          this.formatStore(store, "skipped", { reason: "already_imported" }),
        );
        continue;
      }
      const { profile } = await this.resolveProfile(store);
      const missing = this.missingFields(profile);
      results.push(
        this.formatStore(store, missing.length ? "failed" : "ready", {
          reason: missing.length ? "missing_required_settlement_data" : undefined,
          missing_fields: missing,
          payout_profile: profile,
        }),
      );
    }

    return new DataResponseDto(
      {
        limitation:
          "BudPay has no documented Paystack-style marketplace subaccount API. Import creates/reuses a customer and dedicated virtual account; seller settlement remains a separate payout.",
        summary: {
          total_eligible: stores.length,
          ready_to_import: results.filter((entry) => entry.result === "ready")
            .length,
          missing_required_data: results.filter(
            (entry) => entry.result === "failed",
          ).length,
          already_imported: results.filter(
            (entry) => entry.reason === "already_imported",
          ).length,
        },
        stores: results,
      },
      true,
      "BudPay seller payout profile import preview generated",
    );
  }

  async import(
    options: BudPaySubaccountImportDto = {},
  ): Promise<DataResponseDto> {
    if (options.dryRun) {
      return this.preview(options);
    }

    const where: any = this.eligibleWhere(options.storeId);
    if (options.retryFailed && !options.storeId) {
      where.budpay_import_status = "failed";
    }
    const stores = await this.storeRepository.findAll({
      where,
      order: [["id", "ASC"]],
      limit: Math.min(Math.max(Number(options.limit || 100), 1), 500),
    });
    const results: ImportResult[] = [];

    for (const store of stores) {
      if (this.isImported(store) && !options.force) {
        results.push(
          this.formatStore(store, "skipped", { reason: "already_imported" }),
        );
        continue;
      }

      try {
        const { profile, paystackDetails } = await this.resolveProfile(store);
        const missing = this.missingFields(profile);
        if (missing.length) {
          const reason = `Missing required settlement data: ${missing.join(", ")}`;
          await store.update({
            budpay_import_status: "failed",
            budpay_import_error: reason,
          } as any);
          results.push(
            this.formatStore(store, "failed", {
              reason,
              missing_fields: missing,
              payout_profile: profile,
            }),
          );
          continue;
        }

        const created = await this.createBudPayProfile(store.id, profile);
        const budPayFields = this.extractBudPayFields(created);
        const rawResponse = {
          mode: "seller_payout_profile_with_virtual_account",
          limitation:
            "Dedicated virtual accounts credit the platform BudPay wallet and are not automatic seller split-settlement accounts.",
          deterministic_reference: `alaba_store_${store.id}`,
          source_paystack_subaccount: paystackDetails,
          payout_profile: profile,
          customer_response: created.customerResponse,
          virtual_account_response: created.virtualAccountResponse,
          reused_existing_virtual_account: created.reused,
        };

        await store.update({
          settlement_bank: store.settlement_bank || profile.bank_code,
          settlement_account_number:
            store.settlement_account_number || profile.account_number,
          settlement_account_name:
            store.settlement_account_name || profile.account_name,
          budpay_customer_id: budPayFields.customerId,
          budpay_virtual_account_id: budPayFields.virtualAccountId,
          budpay_account_number: budPayFields.accountNumber,
          budpay_bank_name: budPayFields.bankName,
          budpay_import_status: "success",
          budpay_import_error: null,
          budpay_imported_at: new Date(),
          budpay_raw_response: rawResponse,
        } as any);

        results.push(
          this.formatStore(store, "success", {
            payout_profile: profile,
            budpay: {
              customer_id: budPayFields.customerId,
              customer_code: budPayFields.customerCode,
              virtual_account_id: budPayFields.virtualAccountId,
              account_number: budPayFields.accountNumber,
              bank_name: budPayFields.bankName,
              reused: created.reused,
            },
          }),
        );
      } catch (error) {
        const reason = getErrorMessage(error);
        await store.update({
          budpay_import_status: "failed",
          budpay_import_error: reason,
        } as any);
        this.logger.error(`BudPay import failed for store ${store.id}: ${reason}`);
        results.push(this.formatStore(store, "failed", { reason }));
      }
    }

    const summary = {
      imported: results.filter((entry) => entry.result === "success").length,
      skipped: results.filter((entry) => entry.result === "skipped").length,
      failed: results.filter((entry) => entry.result === "failed").length,
    };
    this.logger.log(
      `BudPay seller profile import completed: imported=${summary.imported}, skipped=${summary.skipped}, failed=${summary.failed}`,
    );

    return new DataResponseDto(
      {
        summary,
        results,
      },
      true,
      "BudPay seller payout profile import completed",
    );
  }

  async status(
    options: BudPayImportStatusQueryDto = {},
  ): Promise<DataResponseDto> {
    const where: any = this.eligibleWhere(options.storeId);
    const stores = await this.storeRepository.findAll({
      where,
      order: [
        ["budpay_imported_at", "DESC"],
        ["id", "ASC"],
      ],
      limit: Math.min(Math.max(Number(options.limit || 100), 1), 500),
    });

    return new DataResponseDto(
      {
        summary: {
          total: stores.length,
          pending: stores.filter(
            (store) => (store.budpay_import_status || "pending") === "pending",
          ).length,
          success: stores.filter(
            (store) => store.budpay_import_status === "success",
          ).length,
          failed: stores.filter(
            (store) => store.budpay_import_status === "failed",
          ).length,
        },
        stores: stores.map((store) => ({
          store_id: store.id,
          store_name: this.storeName(store),
          status: store.budpay_import_status || "pending",
          error: store.budpay_import_error,
          imported_at: store.budpay_imported_at,
          budpay_customer_id: store.budpay_customer_id,
          budpay_virtual_account_id: store.budpay_virtual_account_id,
          budpay_account_number: store.budpay_account_number,
          budpay_bank_name: store.budpay_bank_name,
        })),
      },
      true,
      "BudPay seller payout profile import status fetched",
    );
  }
}
