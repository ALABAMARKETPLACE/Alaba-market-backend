import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/sequelize";
import { firstValueFrom } from "rxjs";
import { Op, Transaction } from "sequelize";
import { Store } from "../STORE/store.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { PaystackAccountConfigService } from "../PAYSTACK_PAYMENT/paystack-account-config.service";
import {
  resolveStoreSubaccountCode,
  resolveStoreSubaccountSelection,
} from "../shared/helpers/paystack-subaccount.helper";

type MigrationStatus = "pending" | "success" | "failed";
type MigrationResultStatus = "preview" | "success" | "failed" | "skipped";

interface MigrationExecutionOptions {
  dryRun?: boolean;
  force?: boolean;
}

interface SyncExistingNewSubaccountsOptions {
  dryRun?: boolean;
  force?: boolean;
  storeIds?: number[];
  perPage?: number;
  maxPages?: number;
  includeResults?: boolean;
  resultLimit?: number;
}

interface CreateSubaccountPayload {
  business_name: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge: number;
  description: string;
  primary_contact_email: string;
  primary_contact_name: string;
  primary_contact_phone: string;
  settlement_schedule: string;
}

interface PaystackSubaccountSummary {
  id: number;
  subaccount_code: string;
  business_name?: string | null;
  primary_contact_email?: string | null;
  primary_contact_phone?: string | null;
  account_number?: string | null;
  percentage_charge?: number | null;
}

@Injectable()
export class PaystackSubaccountMigrationService {
  private readonly logger = new Logger(
    PaystackSubaccountMigrationService.name,
  );
  private readonly paystackBaseUrl = "https://api.paystack.co";

  constructor(
    @InjectModel(Store)
    private readonly storeRepository: typeof Store,
    private readonly httpService: HttpService,
    private readonly paystackAccountConfigService: PaystackAccountConfigService,
  ) {}

  private resolveSellerPercentageForNewAccount(
    percentageCharge?: number | string | null,
  ): number {
    const configuredSellerPercentage =
      this.paystackAccountConfigService.getSellerSplitPercentage("new");
    const parsedPercentage = Number(percentageCharge);

    if (
      !Number.isFinite(parsedPercentage) ||
      parsedPercentage <= 0 ||
      parsedPercentage >= 100
    ) {
      return configuredSellerPercentage;
    }

    if (
      Math.abs(parsedPercentage - 95) < 0.001 &&
      Math.abs(configuredSellerPercentage - 95) > 0.001
    ) {
      return configuredSellerPercentage;
    }

    return Number(parsedPercentage.toFixed(2));
  }

  private toPaystackCompanyPercentageForNewAccount(
    sellerPercentage?: number | string | null,
  ): number {
    const normalizedSellerPercentage =
      this.resolveSellerPercentageForNewAccount(sellerPercentage);
    return Number((100 - normalizedSellerPercentage).toFixed(2));
  }

  async migrateStoreById(
    storeId: number,
    options: MigrationExecutionOptions = {},
  ): Promise<DataResponseDto> {
    const store = await this.storeRepository.findByPk(storeId);

    if (!store) {
      throw new NotFoundException("Store not found");
    }

    const result = await this.migrateStoreRecord(store, options);

    return new DataResponseDto(
      result,
      true,
      options.dryRun
        ? "Store subaccount migration preview generated successfully"
        : "Store subaccount migration completed",
    );
  }

  async migratePendingStores(
    options: MigrationExecutionOptions = {},
  ): Promise<DataResponseDto> {
    const stores = await this.findMigrationCandidates("pending", options.force);
    const results: any[] = [];

    for (const store of stores) {
      results.push(await this.migrateStoreRecord(store, options));
    }

    return new DataResponseDto(
      {
        dryRun: Boolean(options.dryRun),
        force: Boolean(options.force),
        summary: this.buildSummary(results),
        results,
      },
      true,
      options.dryRun
        ? "Pending Paystack subaccount migration preview generated successfully"
        : "Pending Paystack subaccounts migrated",
    );
  }

  async retryFailedMigrations(
    options: MigrationExecutionOptions = {},
  ): Promise<DataResponseDto> {
    const stores = await this.findMigrationCandidates("failed", options.force);
    const results: any[] = [];

    for (const store of stores) {
      results.push(await this.migrateStoreRecord(store, {
        ...options,
        force: true,
      }));
    }

    return new DataResponseDto(
      {
        dryRun: Boolean(options.dryRun),
        force: true,
        summary: this.buildSummary(results),
        results,
      },
      true,
      options.dryRun
        ? "Failed Paystack subaccount retry preview generated successfully"
        : "Failed Paystack subaccount migrations retried",
    );
  }

  async getMigrationStatus(options: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<DataResponseDto> {
    const page = Math.max(Number(options.page || 1), 1);
    const limit = Math.min(Math.max(Number(options.limit || 50), 1), 200);
    const offset = (page - 1) * limit;
    const where = this.buildStatusWhere(options.status);

    const { rows, count } = await this.storeRepository.findAndCountAll({
      where,
      order: [
        ["paystack_subaccount_migrated_at", "DESC"],
        ["updatedAt", "DESC"],
      ],
      limit,
      offset,
    });

    const summary = await this.buildStatusSummary();
    const pageOptions = Object.assign(new PageOptionsDto(), {
      page,
      take: limit,
    });

    return new DataResponseDto(
      {
        summary,
        stores: rows,
      },
      true,
      "Paystack subaccount migration status fetched successfully",
      pageOptions,
      count,
    );
  }

  async exportMigrationStatusCsv(options: {
    status?: string;
  }): Promise<string> {
    const stores = await this.storeRepository.findAll({
      where: this.buildStatusWhere(options.status),
      order: [
        ["paystack_subaccount_migrated_at", "DESC"],
        ["updatedAt", "DESC"],
      ],
    });

    const headers = [
      "store_id",
      "store_name",
      "status",
      "migrated_at",
      "legacy_subaccount_code",
      "new_subaccount_code",
      "migration_error",
    ];
    const rows = stores.map((store) => [
      store.id,
      store.store_name || store.business_name || store.name || "",
      store.paystack_subaccount_migration_status || "",
      store.paystack_subaccount_migrated_at
        ? store.paystack_subaccount_migrated_at.toISOString()
        : "",
      resolveStoreSubaccountCode({
        paystack_subaccount_code_new: undefined,
        paystack_subaccount_code: store.paystack_subaccount_code,
        paystack_subaccount_code_old: store.paystack_subaccount_code_old,
      } as Partial<Store>) || "",
      store.paystack_subaccount_code_new || "",
      store.paystack_subaccount_migration_error || "",
    ]);

    return [headers, ...rows]
      .map((row) => row.map((value) => this.escapeCsvValue(value)).join(","))
      .join("\n");
  }

  async syncExistingNewSubaccounts(
    options: SyncExistingNewSubaccountsOptions = {},
  ): Promise<DataResponseDto> {
    const dryRun = Boolean(options.dryRun);
    const force = Boolean(options.force);
    const perPage = Math.min(Math.max(Number(options.perPage || 100), 1), 100);
    const includeResults =
      typeof options.includeResults === "boolean"
        ? options.includeResults
        : dryRun;
    const resultLimit = Math.min(
      Math.max(Number(options.resultLimit || (dryRun ? 500 : 50)), 1),
      500,
    );
    const localStores = await this.findSyncCandidates(options.storeIds, force);
    const remoteSubaccounts = await this.fetchNewAccountSubaccounts({
      perPage,
      maxPages: options.maxPages,
    });

    const results: Array<Record<string, any>> = [];
    let matched = 0;
    let updated = 0;
    let ambiguous = 0;
    let skipped = 0;
    const tentativeMatches: Array<
      | {
          type: "matched";
          remoteSubaccount: PaystackSubaccountSummary;
          store: Store;
        }
      | {
          type: "ambiguous";
          remoteSubaccount: PaystackSubaccountSummary;
          candidates: Store[];
        }
    > = [];

    for (const remoteSubaccount of remoteSubaccounts) {
      const match = this.matchRemoteSubaccountToStore(
        remoteSubaccount,
        localStores,
      );

      if (match.type === "none") {
        continue;
      }

      if (match.type === "ambiguous") {
        tentativeMatches.push({
          type: "ambiguous",
          remoteSubaccount,
          candidates: match.candidates,
        });
        continue;
      }

      tentativeMatches.push({
        type: "matched",
        remoteSubaccount,
        store: match.store,
      });
    }

    const storeMatchCounts = new Map<number, number>();
    for (const entry of tentativeMatches) {
      if (entry.type !== "matched") {
        continue;
      }

      storeMatchCounts.set(
        entry.store.id,
        (storeMatchCounts.get(entry.store.id) || 0) + 1,
      );
    }

    for (const entry of tentativeMatches) {
      if (entry.type === "ambiguous") {
        ambiguous += 1;
        results.push({
          result: "ambiguous",
          subaccount_code: entry.remoteSubaccount.subaccount_code,
          remote_business_name: entry.remoteSubaccount.business_name || null,
          remote_account_number: entry.remoteSubaccount.account_number || null,
          candidate_store_ids: entry.candidates.map((store) => store.id),
        });
        continue;
      }

      const conflictingMatches = storeMatchCounts.get(entry.store.id) || 0;
      if (conflictingMatches > 1) {
        ambiguous += 1;
        results.push({
          result: "ambiguous",
          subaccount_code: entry.remoteSubaccount.subaccount_code,
          remote_business_name: entry.remoteSubaccount.business_name || null,
          remote_account_number: entry.remoteSubaccount.account_number || null,
          candidate_store_ids: [entry.store.id],
          reason: "multiple_remote_subaccounts_matched_same_store",
        });
        continue;
      }

      matched += 1;
      const sellerPercentage = Number(
        (100 - Number(entry.remoteSubaccount.percentage_charge || 0)).toFixed(2),
      );

      if (!dryRun) {
        await this.persistSyncedNewSubaccount(entry.store, entry.remoteSubaccount, {
          sellerPercentage,
        });
        updated += 1;
      }

      results.push({
        result: dryRun ? "preview" : "updated",
        store_id: entry.store.id,
        store_name:
          entry.store.store_name || entry.store.business_name || entry.store.name,
        subaccount_code: entry.remoteSubaccount.subaccount_code,
        remote_business_name: entry.remoteSubaccount.business_name || null,
        seller_percentage_charge: sellerPercentage,
        company_percentage_charge: Number(
          entry.remoteSubaccount.percentage_charge || 0,
        ),
      });
    }

    for (const store of localStores) {
      const storeHasNewCode = Boolean(
        this.firstNonEmptyValue(store.paystack_subaccount_code_new),
      );
      if (storeHasNewCode && !force) {
        skipped += 1;
      }
    }

    const returnedResults = includeResults
      ? results.slice(0, resultLimit)
      : [];

    return new DataResponseDto(
      {
        dryRun,
        force,
        summary: {
          localCandidates: localStores.length,
          remoteSubaccounts: remoteSubaccounts.length,
          matched,
          updated,
          ambiguous,
          skippedExistingNewCode: skipped,
          totalResults: results.length,
          returnedResults: returnedResults.length,
          resultsTruncated: includeResults && returnedResults.length < results.length,
        },
        results: returnedResults,
      },
      true,
      dryRun
        ? "Paystack new-subaccount sync preview generated successfully"
        : "Paystack new-subaccount sync completed successfully",
    );
  }

  private async findMigrationCandidates(
    mode: "pending" | "failed",
    force = false,
  ): Promise<Store[]> {
    const where: any = {
      subaccount_status: "active",
      [Op.or]: [
        { paystack_subaccount_code: { [Op.ne]: null } },
        { paystack_subaccount_code_old: { [Op.ne]: null } },
      ],
    };

    if (mode === "failed") {
      where.paystack_subaccount_migration_status = "failed";
    } else if (!force) {
      where[Op.and] = [
        {
          [Op.or]: [
            { paystack_subaccount_migration_status: null },
            { paystack_subaccount_migration_status: "pending" },
          ],
        },
        { paystack_subaccount_code_new: null },
      ];
    }

    return this.storeRepository.findAll({
      where,
      order: [["id", "ASC"]],
    });
  }

  private async findSyncCandidates(
    storeIds?: number[],
    force = false,
  ): Promise<Store[]> {
    const where: any = {
      subaccount_status: "active",
      [Op.or]: [
        { paystack_subaccount_code: { [Op.ne]: null } },
        { paystack_subaccount_code_old: { [Op.ne]: null } },
      ],
    };

    if (Array.isArray(storeIds) && storeIds.length > 0) {
      where.id = {
        [Op.in]: storeIds.map((entry) => Number(entry)),
      };
    }

    if (!force) {
      where[Op.and] = [
        ...(Array.isArray(where[Op.and]) ? where[Op.and] : []),
        {
          [Op.or]: [
            { paystack_subaccount_code_new: null },
            { paystack_subaccount_code_new: "" },
          ],
        },
      ];
    }

    return this.storeRepository.findAll({
      where,
      order: [["id", "ASC"]],
    });
  }

  private async fetchNewAccountSubaccounts(options: {
    perPage: number;
    maxPages?: number;
  }): Promise<PaystackSubaccountSummary[]> {
    const results: PaystackSubaccountSummary[] = [];
    let page = 1;
    let pageCount = 1;
    const hardLimit = Math.max(Number(options.maxPages || 0), 0);

    do {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.paystackBaseUrl}/subaccount?perPage=${options.perPage}&page=${page}`,
          {
            headers: this.paystackAccountConfigService.getHeaders("new"),
          },
        ),
      );

      if (!response?.data?.status || !Array.isArray(response?.data?.data)) {
        throw new BadRequestException(
          response?.data?.message ||
            "Unable to fetch subaccounts from the new Paystack account",
        );
      }

      results.push(
        ...response.data.data.map((entry) => ({
          id: Number(entry?.id),
          subaccount_code: String(entry?.subaccount_code || "").trim(),
          business_name: entry?.business_name || null,
          primary_contact_email: entry?.primary_contact_email || null,
          primary_contact_phone: entry?.primary_contact_phone || null,
          account_number: entry?.account_number || null,
          percentage_charge:
            entry?.percentage_charge == null
              ? null
              : Number(entry.percentage_charge),
        })),
      );

      pageCount = Number(response?.data?.meta?.pageCount || page);
      page += 1;
    } while (
      page <= pageCount &&
      (hardLimit === 0 || page <= hardLimit)
    );

    return results.filter((entry) => entry.subaccount_code);
  }

  private matchRemoteSubaccountToStore(
    remoteSubaccount: PaystackSubaccountSummary,
    stores: Store[],
  ):
    | { type: "none" }
    | { type: "matched"; store: Store }
    | { type: "ambiguous"; candidates: Store[] } {
    const normalizedAccountNumber = this.normalizeDigits(
      remoteSubaccount.account_number,
    );

    if (!normalizedAccountNumber) {
      return { type: "none" };
    }

    const candidates = stores.filter((store) => {
      const localAccountNumber = this.normalizeDigits(
        store.settlement_account_number || store.account_number,
      );
      return localAccountNumber === normalizedAccountNumber;
    });

    if (candidates.length === 0) {
      return { type: "none" };
    }

    if (candidates.length === 1) {
      return { type: "matched", store: candidates[0] };
    }

    const scoredCandidates = candidates
      .map((store) => ({
        store,
        score: this.scoreRemoteStoreMatch(remoteSubaccount, store),
      }))
      .sort((left, right) => right.score - left.score);

    const bestScore = scoredCandidates[0]?.score || 0;
    if (bestScore <= 0) {
      return { type: "ambiguous", candidates };
    }

    const bestMatches = scoredCandidates.filter(
      (entry) => entry.score === bestScore,
    );

    if (bestMatches.length !== 1) {
      return {
        type: "ambiguous",
        candidates: bestMatches.map((entry) => entry.store),
      };
    }

    return { type: "matched", store: bestMatches[0].store };
  }

  private scoreRemoteStoreMatch(
    remoteSubaccount: PaystackSubaccountSummary,
    store: Store,
  ): number {
    let score = 0;
    const remoteBusinessName = this.normalizeText(remoteSubaccount.business_name);
    const remoteEmail = this.normalizeText(remoteSubaccount.primary_contact_email);
    const remotePhone = this.normalizeDigits(remoteSubaccount.primary_contact_phone);

    const businessCandidates = [
      store.business_name,
      store.store_name,
      store.name,
    ]
      .map((value) => this.normalizeText(value))
      .filter(Boolean);

    if (remoteBusinessName && businessCandidates.includes(remoteBusinessName)) {
      score += 4;
    }

    const localEmail = this.normalizeText(
      store.primary_contact_email || store.email,
    );
    if (remoteEmail && localEmail && remoteEmail === localEmail) {
      score += 3;
    }

    const localPhone = this.normalizeDigits(
      store.primary_contact_phone || store.phone,
    );
    if (remotePhone && localPhone && remotePhone === localPhone) {
      score += 2;
    }

    return score;
  }

  private async persistSyncedNewSubaccount(
    store: Store,
    remoteSubaccount: PaystackSubaccountSummary,
    options: { sellerPercentage: number },
  ): Promise<void> {
    await this.storeRepository.sequelize!.transaction(
      async (transaction: Transaction) => {
        store.set({
          paystack_subaccount_code_old:
            store.paystack_subaccount_code_old ||
            store.paystack_subaccount_code ||
            undefined,
          paystack_subaccount_code_new: remoteSubaccount.subaccount_code,
          paystack_subaccount_id: remoteSubaccount.id,
          paystack_subaccount_migrated_at: new Date(),
          paystack_subaccount_migration_status: "success",
          paystack_subaccount_migration_error: undefined,
          percentage_charge: options.sellerPercentage,
        } as Partial<Store>);
        await store.save({ transaction });
      },
    );
  }

  private normalizeText(value: unknown): string {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim().toLowerCase().replace(/\s+/g, " ");
  }

  private normalizeDigits(value: unknown): string {
    if (typeof value !== "string" && typeof value !== "number") {
      return "";
    }

    return String(value).replace(/\D+/g, "");
  }

  private async migrateStoreRecord(
    store: Store,
    options: MigrationExecutionOptions,
  ): Promise<Record<string, any>> {
    const dryRun = Boolean(options.dryRun);
    const force = Boolean(options.force);
    const existingSelection = resolveStoreSubaccountSelection(store);
    const legacySubaccountCode =
      store.paystack_subaccount_code_old ||
      store.paystack_subaccount_code ||
      null;

    if (store.paystack_subaccount_code_new && !force) {
      this.logger.log(
        `Skipping store ${store.id}: new Paystack subaccount already exists`,
      );

      return {
        store_id: store.id,
        store_name: store.store_name || store.business_name || store.name,
        result: "skipped" as MigrationResultStatus,
        dry_run: dryRun,
        force,
        legacy_subaccount_code: legacySubaccountCode,
        new_subaccount_code: store.paystack_subaccount_code_new,
        migration_status:
          store.paystack_subaccount_migration_status || ("success" as MigrationStatus),
        message: "Store already has a migrated Paystack subaccount",
      };
    }

    try {
      const enrichedStore = await this.enrichStoreFromLegacySubaccount(store);
      const payload = this.buildCreateSubaccountPayload(enrichedStore);

      if (dryRun) {
        this.logger.log(
          `Dry run: validated Paystack subaccount migration for store ${store.id}`,
        );

        return {
          store_id: store.id,
          store_name: store.store_name || store.business_name || store.name,
          result: "preview" as MigrationResultStatus,
          dry_run: true,
          force,
          current_resolution_source: existingSelection?.source || null,
          legacy_subaccount_code: legacySubaccountCode,
          new_subaccount_code: store.paystack_subaccount_code_new || null,
          migration_status:
            store.paystack_subaccount_migration_status || ("pending" as MigrationStatus),
          paystack_payload: payload,
          message: "Store is eligible for Paystack subaccount migration",
        };
      }

      this.logger.log(
        `Migrating Paystack subaccount for store ${store.id} using the new Paystack account`,
      );

      const createdSubaccount =
        await this.createSubaccountInNewAccount(payload);
      const migratedAt = new Date();

      await this.persistMigrationSuccess(
        store.id,
        legacySubaccountCode,
        createdSubaccount.subaccount_code,
        migratedAt,
      );

      this.logger.log(
        `Migrated Paystack subaccount for store ${store.id}: ${createdSubaccount.subaccount_code}`,
      );

      return {
        store_id: store.id,
        store_name: store.store_name || store.business_name || store.name,
        result: "success" as MigrationResultStatus,
        dry_run: false,
        force,
        current_resolution_source: existingSelection?.source || null,
        legacy_subaccount_code: legacySubaccountCode,
        new_subaccount_code: createdSubaccount.subaccount_code,
        migration_status: "success" as MigrationStatus,
        migrated_at: migratedAt.toISOString(),
        paystack_subaccount_id: createdSubaccount.id,
        message: "Store Paystack subaccount migrated successfully",
      };
    } catch (error) {
      const normalizedError = this.normalizeMigrationError(error);

      this.logger.error(
        `Paystack subaccount migration failed for store ${store.id}: ${normalizedError}`,
      );

      if (!dryRun) {
        await this.persistMigrationFailure(
          store.id,
          legacySubaccountCode,
          normalizedError,
        );
      }

      return {
        store_id: store.id,
        store_name: store.store_name || store.business_name || store.name,
        result: "failed" as MigrationResultStatus,
        dry_run: dryRun,
        force,
        current_resolution_source: existingSelection?.source || null,
        legacy_subaccount_code: legacySubaccountCode,
        new_subaccount_code: store.paystack_subaccount_code_new || null,
        migration_status: "failed" as MigrationStatus,
        error: normalizedError,
        message: "Store Paystack subaccount migration failed",
      };
    }
  }

  private async enrichStoreFromLegacySubaccount(store: Store): Promise<Store> {
    const needsEnrichment =
      !this.firstNonEmptyValue(store.settlement_bank) ||
      !this.firstNonEmptyValue(store.settlement_account_number);

    if (!needsEnrichment) {
      return store;
    }

    const legacyCode =
      store.paystack_subaccount_code_old || store.paystack_subaccount_code;

    if (!legacyCode) {
      return store;
    }

    const legacyDetails = await this.fetchLegacySubaccountDetails(legacyCode);

    if (!legacyDetails) {
      return store;
    }

    this.logger.log(
      `Enriched store ${store.id} with settlement details from legacy Paystack subaccount ${legacyCode}`,
    );

    if (!this.firstNonEmptyValue(store.settlement_bank) && legacyDetails.settlement_bank) {
      (store as any).settlement_bank = legacyDetails.settlement_bank;
    }

    if (!this.firstNonEmptyValue(store.settlement_account_number) && legacyDetails.account_number) {
      (store as any).settlement_account_number = legacyDetails.account_number;
    }

    if (!this.firstNonEmptyValue(store.business_name) && legacyDetails.business_name) {
      (store as any).business_name = legacyDetails.business_name;
    }

    if (!this.firstNonEmptyValue(store.primary_contact_email) && legacyDetails.primary_contact_email) {
      (store as any).primary_contact_email = legacyDetails.primary_contact_email;
    }

    if (!this.firstNonEmptyValue(store.primary_contact_name) && legacyDetails.primary_contact_name) {
      (store as any).primary_contact_name = legacyDetails.primary_contact_name;
    }

    if (!this.firstNonEmptyValue(store.primary_contact_phone) && legacyDetails.primary_contact_phone) {
      (store as any).primary_contact_phone = legacyDetails.primary_contact_phone;
    }

    return store;
  }

  private async fetchLegacySubaccountDetails(
    subaccountCode: string,
  ): Promise<Record<string, any> | null> {
    for (const account of ["old", "default"] as const) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(
            `${this.paystackBaseUrl}/subaccount/${subaccountCode}`,
            { headers: this.paystackAccountConfigService.getHeaders(account) },
          ),
        );

        if (response?.data?.status && response?.data?.data) {
          this.logger.log(
            `Fetched legacy subaccount details for ${subaccountCode} via ${account} account`,
          );
          return response.data.data;
        }
      } catch (error) {
        const normalizedError = error as any;
        const status = normalizedError?.response?.status;
        if (status === 404) {
          this.logger.debug(
            `Subaccount ${subaccountCode} not found in ${account} account, trying next`,
          );
          continue;
        }

        this.logger.warn(
          `Failed to fetch legacy subaccount details for ${subaccountCode} via ${account} account: ${normalizedError?.message}`,
        );
      }
    }

    this.logger.warn(
      `Subaccount ${subaccountCode} not found in any Paystack account — settlement bank must be set manually`,
    );
    return null;
  }

  private buildCreateSubaccountPayload(store: Store): CreateSubaccountPayload {
    const businessName = this.firstNonEmptyValue(
      store.business_name,
      store.store_name,
      store.name,
    );
    const settlementBank = this.firstNonEmptyValue(store.settlement_bank);
    const accountNumber = this.firstNonEmptyValue(
      store.settlement_account_number,
    );
    const primaryContactEmail = this.firstNonEmptyValue(
      store.primary_contact_email,
      store.email,
    );
    const primaryContactName = this.firstNonEmptyValue(
      store.primary_contact_name,
      store.name,
      businessName,
    );
    const primaryContactPhone = this.firstNonEmptyValue(
      store.primary_contact_phone,
      store.phone,
    );

    if (!businessName) {
      throw new BadRequestException(
        "Missing business name required for Paystack subaccount migration",
      );
    }

    if (!settlementBank) {
      throw new BadRequestException(
        "Missing settlement bank required for Paystack subaccount migration",
      );
    }

    if (!accountNumber) {
      throw new BadRequestException(
        "Missing settlement account number required for Paystack subaccount migration",
      );
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      throw new BadRequestException(
        "Invalid settlement account number. Expected a 10-digit account number",
      );
    }

    if (!primaryContactEmail) {
      throw new BadRequestException(
        "Missing primary contact email required for Paystack subaccount migration",
      );
    }

    if (!primaryContactName) {
      throw new BadRequestException(
        "Missing primary contact name required for Paystack subaccount migration",
      );
    }

    if (!primaryContactPhone) {
      throw new BadRequestException(
        "Missing primary contact phone required for Paystack subaccount migration",
      );
    }

    return {
      business_name: businessName,
      settlement_bank: settlementBank,
      account_number: accountNumber,
      percentage_charge: this.toPaystackCompanyPercentageForNewAccount(
        store.percentage_charge,
      ),
      description: `Migrated subaccount for store ${store.id}`,
      primary_contact_email: primaryContactEmail,
      primary_contact_name: primaryContactName,
      primary_contact_phone: primaryContactPhone,
      settlement_schedule: store.settlement_schedule || "auto",
    };
  }

  private async createSubaccountInNewAccount(
    payload: CreateSubaccountPayload,
  ): Promise<{ id: number; subaccount_code: string }> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.paystackBaseUrl}/subaccount`, payload, {
        headers: this.paystackAccountConfigService.getHeaders("new"),
      }),
    );

    if (!response?.data?.status || !response?.data?.data?.subaccount_code) {
      throw new BadRequestException(
        response?.data?.message || "Paystack did not return a new subaccount code",
      );
    }

    return response.data.data;
  }

  private async persistMigrationSuccess(
    storeId: number,
    legacySubaccountCode: string | null,
    newSubaccountCode: string,
    migratedAt: Date,
  ): Promise<void> {
    await this.storeRepository.sequelize!.transaction(
      async (transaction: Transaction) => {
        const store = await this.storeRepository.findByPk(storeId, {
          transaction,
        });

        if (!store) {
          throw new NotFoundException("Store not found");
        }

        // Preserve the legacy code path until the old account is fully retired.
        store.set({
          paystack_subaccount_code_old:
            store.paystack_subaccount_code_old || legacySubaccountCode || undefined,
          paystack_subaccount_code_new: newSubaccountCode,
          paystack_subaccount_migrated_at: migratedAt,
          paystack_subaccount_migration_status: "success",
          paystack_subaccount_migration_error: undefined,
        } as Partial<Store>);
        await store.save({ transaction });
      },
    );
  }

  private async persistMigrationFailure(
    storeId: number,
    legacySubaccountCode: string | null,
    errorMessage: string,
  ): Promise<void> {
    await this.storeRepository.sequelize!.transaction(
      async (transaction: Transaction) => {
        const store = await this.storeRepository.findByPk(storeId, {
          transaction,
        });

        if (!store) {
          throw new NotFoundException("Store not found");
        }

        store.set({
          paystack_subaccount_code_old:
            store.paystack_subaccount_code_old || legacySubaccountCode || undefined,
          paystack_subaccount_migration_status: "failed",
          paystack_subaccount_migration_error: errorMessage,
        } as Partial<Store>);
        await store.save({ transaction });
      },
    );
  }

  private buildSummary(results: Array<{ result: MigrationResultStatus }>) {
    return results.reduce(
      (acc, result) => {
        acc.total += 1;
        acc[result.result] += 1;
        return acc;
      },
      {
        total: 0,
        preview: 0,
        success: 0,
        failed: 0,
        skipped: 0,
      },
    );
  }

  private async buildStatusSummary() {
    const [pending, success, failed] = await Promise.all([
      this.storeRepository.count({
        where: { paystack_subaccount_migration_status: "pending" },
      }),
      this.storeRepository.count({
        where: { paystack_subaccount_migration_status: "success" },
      }),
      this.storeRepository.count({
        where: { paystack_subaccount_migration_status: "failed" },
      }),
    ]);

    return {
      pending,
      success,
      failed,
    };
  }

  private buildStatusWhere(status?: string) {
    if (!status) {
      return {
        [Op.or]: [
          { paystack_subaccount_migration_status: { [Op.ne]: null } },
          { paystack_subaccount_code_new: { [Op.ne]: null } },
        ],
      };
    }

    return {
      paystack_subaccount_migration_status: status,
    };
  }

  private normalizeMigrationError(error: any): string {
    const responseStatus = error?.response?.status;
    const responseMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Unknown migration error";

    const normalizedMessage =
      typeof responseMessage === "string"
        ? responseMessage
        : JSON.stringify(responseMessage);

    return responseStatus
      ? `[${responseStatus}] ${normalizedMessage}`
      : normalizedMessage;
  }

  private firstNonEmptyValue(...values: Array<string | null | undefined>) {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private escapeCsvValue(value: unknown): string {
    const normalizedValue =
      value === null || value === undefined ? "" : String(value);
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }
}
