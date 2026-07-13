import { createStructuredLogger } from "../shared/logger/structured-logger";
import {
  Injectable,
  HttpException,
  HttpStatus,
  // Inject,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { PaystackSubaccount } from "./paystack-subaccount.entity";
import { Store } from "../STORE/store.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Op, Transaction } from "sequelize";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { PaystackAccountConfigService } from "../PAYSTACK_PAYMENT/paystack-account-config.service";
import { UpdateSubaccountPercentageDto } from "./dto/update-subaccount-percentage.dto";
import { UnmatchedRemoteSubaccountsQueryDto } from "./dto/unmatched-remote-subaccounts.dto";
import { ResolveUnmatchedRemoteSubaccountsDto } from "./dto/resolve-unmatched-remote-subaccounts.dto";

const appLog = createStructuredLogger("paystack_subaccount_service");

interface RemoteNewAccountSubaccount {
  id?: number | null;
  subaccount_code: string;
  business_name?: string | null;
  primary_contact_email?: string | null;
  primary_contact_phone?: string | null;
  account_number?: string | null;
  percentage_charge?: number | null;
}

type UnmatchedRemoteClassification =
  | "duplicate_candidate"
  | "missing_local_link"
  | "ambiguous_candidate"
  | "orphan";

interface ClassifiedUnmatchedRemoteSubaccount {
  remoteSubaccount: RemoteNewAccountSubaccount;
  classification: UnmatchedRemoteClassification;
  candidateStoreIds: number[];
  reason: string;
}

@Injectable()
export class PaystackSubaccountService {
  private readonly paystackBaseUrl = "https://api.paystack.co";

  constructor(
  @InjectModel(PaystackSubaccount)
  private readonly paystackSubaccountRepository: typeof PaystackSubaccount,

  @InjectModel(Store)
  private readonly storeRepository: typeof Store,

  private readonly httpService: HttpService,
  private readonly paystackAccountConfigService: PaystackAccountConfigService,
) {}

  private resolveRequestedSellerPercentage(
    percentageCharge?: number | string | null,
    account: "default" | "old" | "new" = "default",
  ): number {
    const configuredSellerPercentage =
      this.paystackAccountConfigService.getSellerSplitPercentage(account);
    const parsedPercentage = Number(percentageCharge);

    if (
      !Number.isFinite(parsedPercentage) ||
      parsedPercentage <= 0 ||
      parsedPercentage >= 100
    ) {
      return configuredSellerPercentage;
    }

    if (
      account === "new" &&
      Math.abs(parsedPercentage - 95) < 0.001 &&
      Math.abs(configuredSellerPercentage - 95) > 0.001
    ) {
      return configuredSellerPercentage;
    }

    return Number(parsedPercentage.toFixed(2));
  }

  private normalizeSellerPercentage(
    percentageCharge?: number | string | null,
    account: "default" | "old" | "new" = "default",
  ): number {
    const sellerPercentage = this.resolveRequestedSellerPercentage(
      percentageCharge,
      account,
    );

    if (sellerPercentage <= 0 || sellerPercentage >= 100) {
      throw new HttpException(
        "percentage_charge must be between 0 and 100",
        HttpStatus.BAD_REQUEST,
      );
    }

    return Number(sellerPercentage.toFixed(2));
  }

  private toPaystackCompanyPercentage(
    sellerPercentage: number,
    account: "default" | "old" | "new" = "default",
  ): number {
    const normalizedSellerPercentage = this.normalizeSellerPercentage(
      sellerPercentage,
      account,
    );
    return Number((100 - normalizedSellerPercentage).toFixed(2));
  }

  private buildPercentageUpdateWhere(storeIds?: number[]) {
    const where: any = {
      paystack_subaccount_code_new: {
        [Op.ne]: null,
      },
    };

    if (Array.isArray(storeIds) && storeIds.length > 0) {
      where.id = {
        [Op.in]: storeIds.map((entry) => Number(entry)),
      };
    }

    return where;
  }

  private buildRemoteClassificationWhere(storeIds?: number[]) {
    const where: any = {
      settlement_account_number: {
        [Op.ne]: null,
      },
    };

    if (Array.isArray(storeIds) && storeIds.length > 0) {
      where.id = {
        [Op.in]: storeIds.map((entry) => Number(entry)),
      };
    }

    return where;
  }

  private buildTargetedRemoteSubaccountCodeSet(
    stores: Store[],
    remoteSubaccounts: RemoteNewAccountSubaccount[],
  ): { targetedCodes: Set<string>; localTargetableTotal: number } {
    const targetedCodes = new Set<string>();
    let localTargetableTotal = 0;

    for (const store of stores) {
      const targetSubaccountCodes = this.resolveTargetNewAccountSubaccounts(
        store,
        remoteSubaccounts,
      );

      if (targetSubaccountCodes.length === 0) {
        continue;
      }

      localTargetableTotal += 1;
      for (const targetCode of targetSubaccountCodes) {
        targetedCodes.add(targetCode);
      }
    }

    return { targetedCodes, localTargetableTotal };
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

  private normalizeDryRun(value: unknown): boolean {
    if (value === true) {
      return true;
    }

    if (value === false || value === undefined || value === null || value === "") {
      return false;
    }

    const normalizedValue = String(value).trim().toLowerCase();
    return ["true", "1", "yes"].includes(normalizedValue);
  }

  private scoreRemoteSubaccountForStore(
    remoteSubaccount: RemoteNewAccountSubaccount,
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

  private async fetchAllNewAccountSubaccounts(): Promise<
    RemoteNewAccountSubaccount[]
  > {
    const results: RemoteNewAccountSubaccount[] = [];
    let page = 1;
    let pageCount = 1;

    do {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.paystackBaseUrl}/subaccount?perPage=100&page=${page}`,
          {
            headers: this.paystackAccountConfigService.getHeaders("new"),
          },
        ),
      );

      if (!response?.data?.status || !Array.isArray(response?.data?.data)) {
        throw new Error(
          response?.data?.message ||
            "Unable to fetch subaccounts from the new Paystack account",
        );
      }

      results.push(
        ...response.data.data.map((entry) => ({
          id: entry?.id == null ? null : Number(entry.id),
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
    } while (page <= pageCount);

    return results.filter((entry) => entry.subaccount_code);
  }

  private resolveTargetNewAccountSubaccounts(
    store: Store,
    remoteSubaccounts: RemoteNewAccountSubaccount[],
  ): string[] {
    const localCode = String(store.paystack_subaccount_code_new || "").trim();
    const normalizedAccountNumber = this.normalizeDigits(
      store.settlement_account_number || (store as any).account_number,
    );
    const matchedCodes = new Set<string>();

    if (localCode) {
      matchedCodes.add(localCode);
    }

    if (!normalizedAccountNumber) {
      return [...matchedCodes];
    }

    for (const remoteSubaccount of remoteSubaccounts) {
      if (
        this.normalizeDigits(remoteSubaccount.account_number) !==
        normalizedAccountNumber
      ) {
        continue;
      }

      if (
        remoteSubaccount.subaccount_code === localCode ||
        this.scoreRemoteSubaccountForStore(remoteSubaccount, store) > 0
      ) {
        matchedCodes.add(remoteSubaccount.subaccount_code);
      }
    }

    return [...matchedCodes];
  }

  private classifyUnmatchedRemoteSubaccount(
    remoteSubaccount: RemoteNewAccountSubaccount,
    stores: Store[],
  ): Omit<ClassifiedUnmatchedRemoteSubaccount, "remoteSubaccount"> {
    const normalizedAccountNumber = this.normalizeDigits(
      remoteSubaccount.account_number,
    );

    if (!normalizedAccountNumber) {
      return {
        classification: "orphan",
        candidateStoreIds: [],
        reason: "remote_subaccount_has_no_account_number",
      };
    }

    const accountMatches = stores.filter(
      (store) =>
        this.normalizeDigits(
          store.settlement_account_number || (store as any).account_number,
        ) === normalizedAccountNumber,
    );

    if (accountMatches.length === 0) {
      return {
        classification: "orphan",
        candidateStoreIds: [],
        reason: "no_local_store_with_matching_account_number",
      };
    }

    const linkedCandidates = accountMatches.filter((store) =>
      Boolean(String(store.paystack_subaccount_code_new || "").trim()),
    );
    if (linkedCandidates.length > 0) {
      return {
        classification: "duplicate_candidate",
        candidateStoreIds: linkedCandidates.map((store) => Number(store.id)),
        reason: "matching_account_number_already_linked_to_local_store",
      };
    }

    if (accountMatches.length === 1) {
      return {
        classification: "missing_local_link",
        candidateStoreIds: [Number(accountMatches[0].id)],
        reason: "single_local_store_matches_account_number_but_has_no_new_code",
      };
    }

    const scoredCandidates = accountMatches
      .map((store) => ({
        store,
        score: this.scoreRemoteSubaccountForStore(remoteSubaccount, store),
      }))
      .sort((left, right) => right.score - left.score);

    const bestScore = scoredCandidates[0]?.score || 0;
    const bestMatches = scoredCandidates.filter(
      (entry) => entry.score === bestScore,
    );

    if (bestScore > 0 && bestMatches.length === 1) {
      return {
        classification: "missing_local_link",
        candidateStoreIds: [Number(bestMatches[0].store.id)],
        reason: "single_best_local_store_match_needs_new_code_link",
      };
    }

    return {
      classification: "ambiguous_candidate",
      candidateStoreIds: accountMatches.map((store) => Number(store.id)),
      reason: "multiple_local_stores_share_same_account_number",
    };
  }

  private async updatePaystackSubaccountPercentage(
    subaccountCode: string,
    sellerPercentage: number,
  ) {
    const paystackPercentageCharge =
      this.toPaystackCompanyPercentage(sellerPercentage, "new");
    const response = await firstValueFrom(
      this.httpService.put(
        `${this.paystackBaseUrl}/subaccount/${subaccountCode}`,
        {
          percentage_charge: paystackPercentageCharge,
        },
        {
          headers: this.paystackAccountConfigService.getHeaders("new"),
        },
      ),
    );

    if (!response?.data?.status) {
      throw new Error(
        response?.data?.message || "Paystack did not confirm the subaccount update",
      );
    }

    return response.data.data;
  }

  async bulkUpdateNewAccountSubaccountPercentages(
    payload: UpdateSubaccountPercentageDto,
  ): Promise<DataResponseDto> {
    try {
      const dryRun = this.normalizeDryRun(payload.dryRun);
      const sellerPercentage = this.normalizeSellerPercentage(
        payload.percentage_charge,
        "new",
      );
      const companyPercentage = Number((100 - sellerPercentage).toFixed(2));
      const stores = await this.storeRepository.findAll({
        where: this.buildPercentageUpdateWhere(payload.storeIds),
        order: [["id", "ASC"]],
      });
      const remoteSubaccounts = await this.fetchAllNewAccountSubaccounts();

      const results: Array<Record<string, any>> = [];
      let updated = 0;
      let failed = 0;
      const failedStoreIds: number[] = [];
      const {
        targetedCodes: targetedRemoteSubaccountCodes,
        localTargetableTotal,
      } = this.buildTargetedRemoteSubaccountCodeSet(stores, remoteSubaccounts);

      for (const store of stores) {
        const subaccountCode = String(store.paystack_subaccount_code_new || "").trim();
        const targetSubaccountCodes = this.resolveTargetNewAccountSubaccounts(
          store,
          remoteSubaccounts,
        );

        if (targetSubaccountCodes.length === 0) {
          results.push({
            store_id: store.id,
            store_name: store.store_name || store.business_name || store.name,
            result: "skipped",
            reason: "Store does not have a new Paystack subaccount code",
          });
          continue;
        }

        if (dryRun) {
          results.push({
            store_id: store.id,
            store_name: store.store_name || store.business_name || store.name,
            result: "preview",
            subaccount_code: subaccountCode,
            target_subaccount_codes: targetSubaccountCodes,
            previous_percentage_charge: Number(store.percentage_charge || 0),
            next_percentage_charge: sellerPercentage,
            company_percentage: companyPercentage,
            paystack_percentage_charge: companyPercentage,
          });
          continue;
        }

        try {
          const paystackResponses: Array<Record<string, any>> = [];
          for (const targetCode of targetSubaccountCodes) {
            paystackResponses.push(
              await this.updatePaystackSubaccountPercentage(
                targetCode,
                sellerPercentage,
              ),
            );
          }

          await this.storeRepository.sequelize.transaction(
            async (transaction: Transaction) => {
              await store.update(
                {
                  percentage_charge: sellerPercentage,
                },
                { transaction },
              );

              const subaccount =
                await this.paystackSubaccountRepository.findOne({
                  where: { store_id: store.id },
                  transaction,
                });

              if (subaccount) {
                await subaccount.update(
                  {
                    percentage_charge: sellerPercentage,
                    paystack_response:
                      paystackResponses[paystackResponses.length - 1] || null,
                  },
                  { transaction },
                );
              }
            },
          );

          updated += 1;
          results.push({
            store_id: store.id,
            store_name: store.store_name || store.business_name || store.name,
            result: "updated",
            subaccount_code: subaccountCode,
            target_subaccount_codes: targetSubaccountCodes,
            percentage_charge: sellerPercentage,
            company_percentage: companyPercentage,
            paystack_percentage_charge: companyPercentage,
          });
        } catch (error) {
          failed += 1;
          failedStoreIds.push(Number(store.id));
          results.push({
            store_id: store.id,
            store_name: store.store_name || store.business_name || store.name,
            result: "failed",
            subaccount_code: subaccountCode,
            error: getErrorMessage(error),
          });
        }
      }

      return new DataResponseDto(
        {
          dryRun,
          percentage_charge: sellerPercentage,
          company_percentage: companyPercentage,
          paystack_percentage_charge: companyPercentage,
          summary: {
            total: stores.length,
            remote_total: remoteSubaccounts.length,
            local_targetable_total: localTargetableTotal,
            targeted_remote_total: targetedRemoteSubaccountCodes.size,
            unmatched_remote_total:
              remoteSubaccounts.length - targetedRemoteSubaccountCodes.size,
            updated,
            failed,
            preview: dryRun ? results.length : 0,
            failed_store_ids: failedStoreIds,
          },
          results,
        },
        true,
        dryRun
          ? "Paystack subaccount percentage update preview generated successfully"
          : "Paystack subaccount percentages updated successfully",
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getUnmatchedRemoteSubaccounts(
    query: UnmatchedRemoteSubaccountsQueryDto = {},
  ): Promise<DataResponseDto> {
    try {
      const page = Math.max(Number(query.page || 1), 1);
      const limit = Math.min(Math.max(Number(query.limit || 100), 1), 200);
      const offset = (page - 1) * limit;

      const stores = await this.storeRepository.findAll({
        where: this.buildPercentageUpdateWhere(query.storeIds),
        order: [["id", "ASC"]],
      });
      const classificationStores = await this.storeRepository.findAll({
        where: this.buildRemoteClassificationWhere(query.storeIds),
        order: [["id", "ASC"]],
      });
      const remoteSubaccounts = await this.fetchAllNewAccountSubaccounts();
      const {
        targetedCodes: targetedRemoteSubaccountCodes,
        localTargetableTotal,
      } = this.buildTargetedRemoteSubaccountCodeSet(stores, remoteSubaccounts);

      const unmatchedRemoteSubaccounts = remoteSubaccounts.filter(
        (remoteSubaccount) =>
          !targetedRemoteSubaccountCodes.has(remoteSubaccount.subaccount_code),
      );

      const classifiedItems = unmatchedRemoteSubaccounts.map((remoteSubaccount) => {
        const classification = this.classifyUnmatchedRemoteSubaccount(
          remoteSubaccount,
          classificationStores,
        );

        return {
          remoteSubaccount,
          classification: classification.classification,
          candidateStoreIds: classification.candidateStoreIds,
          reason: classification.reason,
        } as ClassifiedUnmatchedRemoteSubaccount;
      });

      const pagedItems = classifiedItems.slice(offset, offset + limit).map((entry) => ({
        subaccount_code: entry.remoteSubaccount.subaccount_code,
        business_name: entry.remoteSubaccount.business_name || null,
        primary_contact_email: entry.remoteSubaccount.primary_contact_email || null,
        primary_contact_phone: entry.remoteSubaccount.primary_contact_phone || null,
        account_number: entry.remoteSubaccount.account_number || null,
        classification: entry.classification,
        candidate_store_ids: entry.candidateStoreIds,
        reason: entry.reason,
      }));

      return new DataResponseDto(
        {
          summary: {
            remote_total: remoteSubaccounts.length,
            local_store_total: stores.length,
            local_targetable_total: localTargetableTotal,
            targeted_remote_total: targetedRemoteSubaccountCodes.size,
            unmatched_remote_total: unmatchedRemoteSubaccounts.length,
            page,
            limit,
          },
          items: pagedItems,
        },
        true,
        "Unmatched remote Paystack subaccounts fetched successfully",
        {
          page,
          take: limit,
        } as any,
        unmatchedRemoteSubaccounts.length,
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async resolveUnmatchedRemoteSubaccounts(
    payload: ResolveUnmatchedRemoteSubaccountsDto = {},
  ): Promise<DataResponseDto> {
    try {
      const dryRun = this.normalizeDryRun(payload.dryRun);
      const allowedClassifications = new Set(
        (payload.classifications?.length
          ? payload.classifications
          : ["missing_local_link"]
        ).map((entry) => String(entry).trim()),
      );
      const allowedSubaccountCodes = payload.subaccountCodes?.length
        ? new Set(payload.subaccountCodes.map((entry) => String(entry).trim()))
        : null;
      const page = Math.max(Number(payload.page || 1), 1);
      const limit = Math.min(Math.max(Number(payload.limit || 200), 1), 200);
      const offset = (page - 1) * limit;

      const stores = await this.storeRepository.findAll({
        where: this.buildPercentageUpdateWhere(payload.storeIds),
        order: [["id", "ASC"]],
      });
      const classificationStores = await this.storeRepository.findAll({
        where: this.buildRemoteClassificationWhere(payload.storeIds),
        order: [["id", "ASC"]],
      });
      const remoteSubaccounts = await this.fetchAllNewAccountSubaccounts();
      const {
        targetedCodes: targetedRemoteSubaccountCodes,
      } = this.buildTargetedRemoteSubaccountCodeSet(stores, remoteSubaccounts);

      const unmatchedRemoteSubaccounts = remoteSubaccounts.filter(
        (remoteSubaccount) =>
          !targetedRemoteSubaccountCodes.has(remoteSubaccount.subaccount_code),
      );

      const classifiedUnmatchedRemoteSubaccounts = unmatchedRemoteSubaccounts.map(
        (remoteSubaccount) => {
          const classification = this.classifyUnmatchedRemoteSubaccount(
            remoteSubaccount,
            classificationStores,
          );

          return {
            remoteSubaccount,
            classification: classification.classification,
            candidateStoreIds: classification.candidateStoreIds,
            reason: classification.reason,
          } as ClassifiedUnmatchedRemoteSubaccount;
        },
      );

      const resolvableCandidates = classifiedUnmatchedRemoteSubaccounts.filter(
        ({ remoteSubaccount, classification, candidateStoreIds }) => {
          if (!allowedClassifications.has(classification)) {
            return false;
          }

          if (
            allowedSubaccountCodes &&
            !allowedSubaccountCodes.has(remoteSubaccount.subaccount_code)
          ) {
            return false;
          }

          return candidateStoreIds.length === 1;
        },
      );

      const pagedCandidates = resolvableCandidates.slice(offset, offset + limit);
      const results: Array<Record<string, any>> = [];
      let resolved = 0;
      let failed = 0;

      for (const entry of pagedCandidates) {
        const candidateStoreId = entry.candidateStoreIds[0];
        const store = classificationStores.find(
          (item) => Number(item.id) === Number(candidateStoreId),
        );

        if (!store) {
          failed += 1;
          results.push({
            result: "failed",
            subaccount_code: entry.remoteSubaccount.subaccount_code,
            candidate_store_ids: entry.candidateStoreIds,
            reason: "candidate_store_not_found",
          });
          continue;
        }

        const sellerPercentage =
          entry.remoteSubaccount.percentage_charge == null
            ? this.paystackAccountConfigService.getSellerSplitPercentage("new")
            : Number(
                (100 - Number(entry.remoteSubaccount.percentage_charge)).toFixed(2),
              );

        if (dryRun) {
          results.push({
            result: "preview",
            classification: entry.classification,
            subaccount_code: entry.remoteSubaccount.subaccount_code,
            business_name: entry.remoteSubaccount.business_name || null,
            account_number: entry.remoteSubaccount.account_number || null,
            candidate_store_id: Number(store.id),
            candidate_store_name:
              store.store_name || store.business_name || store.name,
            next_percentage_charge: sellerPercentage,
          });
          continue;
        }

        await this.storeRepository.sequelize.transaction(
          async (transaction: Transaction) => {
            await store.update(
              {
                paystack_subaccount_code_old:
                  store.paystack_subaccount_code_old ||
                  store.paystack_subaccount_code ||
                  null,
                paystack_subaccount_code_new: entry.remoteSubaccount.subaccount_code,
                paystack_subaccount_id: entry.remoteSubaccount.id || null,
                paystack_subaccount_migrated_at: new Date(),
                paystack_subaccount_migration_status: "success",
                paystack_subaccount_migration_error: null,
                percentage_charge: sellerPercentage,
              },
              { transaction },
            );
          },
        );

        resolved += 1;
        results.push({
          result: "resolved",
          classification: entry.classification,
          subaccount_code: entry.remoteSubaccount.subaccount_code,
          business_name: entry.remoteSubaccount.business_name || null,
          account_number: entry.remoteSubaccount.account_number || null,
          candidate_store_id: Number(store.id),
          candidate_store_name:
            store.store_name || store.business_name || store.name,
          percentage_charge: sellerPercentage,
        });
      }

      return new DataResponseDto(
        {
          dryRun,
          filters: {
            classifications: [...allowedClassifications],
            subaccountCodes: allowedSubaccountCodes
              ? [...allowedSubaccountCodes]
              : null,
            page,
            limit,
          },
          summary: {
            unmatched_remote_total: unmatchedRemoteSubaccounts.length,
            resolvable_total: resolvableCandidates.length,
            preview: dryRun ? results.length : 0,
            resolved,
            failed,
          },
          results,
        },
        true,
        dryRun
          ? "Resolvable unmatched remote Paystack subaccounts preview generated successfully"
          : "Resolvable unmatched remote Paystack subaccounts linked successfully",

        );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Generate provisional subaccount code
  private generateProvisionalCode(): string {
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `ACCT_${randomStr}${timestamp}`;
  }

  // Create subaccount request (pending admin approval)
  async createSubaccountRequest(storeId: number, subaccountData: any): Promise<DataResponseDto> {
    try {
      return await this.storeRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          // Check if store exists and doesn't already have a subaccount
          const store = await this.storeRepository.findByPk(storeId, {
            transaction,
          });
          if (!store) {
            throw new HttpException("Store not found", HttpStatus.NOT_FOUND);
          }

          // Check if subaccount already exists for this store
          const existingSubaccount = await this.paystackSubaccountRepository.findOne({
            where: { store_id: storeId },
            transaction,
          });
          if (existingSubaccount) {
            throw new HttpException(
              "Subaccount request already exists for this store",
              HttpStatus.CONFLICT
            );
          }

          // Generate provisional code
          const provisionalCode = this.generateProvisionalCode();
          const sellerPercentage = this.resolveRequestedSellerPercentage(
            subaccountData.percentage_charge,
          );

          // Create subaccount record with pending status
          const subaccountRequest = await this.paystackSubaccountRepository.create(
            {
              store_id: storeId,
              subaccount_code: provisionalCode,
              business_name: subaccountData.business_name || store.store_name,
              settlement_bank: subaccountData.settlement_bank,
              settlement_account_number: subaccountData.settlement_account_number,
              settlement_account_name: subaccountData.settlement_account_name,
              primary_contact_email: subaccountData.primary_contact_email || store.email,
              primary_contact_name: subaccountData.primary_contact_name || store.name,
              primary_contact_phone: subaccountData.primary_contact_phone || store.phone,
              percentage_charge: sellerPercentage,
              status: "pending",
              admin_approval_status: "pending",
              is_active: false,
            },
            { transaction }
          );

          // Update store with pending subaccount info
          await store.update(
            {
              paystack_subaccount_code: provisionalCode,
              subaccount_status: "pending",
              business_name: subaccountData.business_name || store.store_name,
              settlement_bank: subaccountData.settlement_bank,
              settlement_account_number: subaccountData.settlement_account_number,
              settlement_account_name: subaccountData.settlement_account_name,
              primary_contact_email: subaccountData.primary_contact_email || store.email,
              primary_contact_name: subaccountData.primary_contact_name || store.name,
              primary_contact_phone: subaccountData.primary_contact_phone || store.phone,
            },
            { transaction }
          );

          return {
            status: true,
            statusCode: HttpStatus.CREATED,
            message: "Subaccount request created successfully",
            data: subaccountRequest
          };
        }
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Admin approves subaccount and creates it in Paystack
  async approveSubaccount(subaccountId: number, adminUserId: number): Promise<DataResponseDto> {
    try {
      return await this.storeRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          // Get subaccount request
          const subaccount = await this.paystackSubaccountRepository.findByPk(
            subaccountId,
            {
              include: [{ model: Store }],
              transaction,
            }
          );

          if (!subaccount) {
            throw new HttpException(
              "Subaccount request not found",
              HttpStatus.NOT_FOUND
            );
          }

          if (subaccount.admin_approval_status !== "pending") {
            throw new HttpException(
              "Subaccount request already processed",
              HttpStatus.CONFLICT
            );
          }

          // Create subaccount in Paystack
          const paystackResponse = await this.createPaystackSubaccount(subaccount);

          // Update subaccount record
          await subaccount.update(
            {
              paystack_subaccount_id: paystackResponse.data.subaccount_code,
              status: "active",
              admin_approval_status: "approved",
              admin_approved_by: adminUserId,
              admin_approved_at: new Date(),
              paystack_response: paystackResponse.data,
              is_active: true,
            },
            { transaction }
          );

          // Update store record
          await subaccount.store.update(
            {
              paystack_subaccount_id: paystackResponse.data.id,
              paystack_subaccount_code: paystackResponse.data.subaccount_code,
              subaccount_status: "active",
            },
            { transaction }
          );

          return {
            status: true,
            statusCode: HttpStatus.OK,
            message: "Subaccount approved successfully",
            data: subaccount
          };
        }
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Create subaccount in Paystack via API
  private async createPaystackSubaccount(subaccount: PaystackSubaccount) {
    try {
      const payload = {
        business_name: subaccount.business_name,
        settlement_bank: subaccount.settlement_bank,
        account_number: subaccount.settlement_account_number,
        percentage_charge: this.toPaystackCompanyPercentage(
          this.resolveRequestedSellerPercentage(
            subaccount.percentage_charge,
            this.paystackAccountConfigService.getDefaultAccountType(),
          ),
          this.paystackAccountConfigService.getDefaultAccountType(),
        ),
        description: `Subaccount for ${subaccount.business_name}`,
        primary_contact_email: subaccount.primary_contact_email,
        primary_contact_name: subaccount.primary_contact_name,
        primary_contact_phone: subaccount.primary_contact_phone,
        settlement_schedule: subaccount.settlement_schedule,
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.paystackBaseUrl}/subaccount`, payload, {
          headers: this.paystackAccountConfigService.getHeaders(),
        })
      );

      if (!response.data.status) {
        throw new Error(`Paystack API Error: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create Paystack subaccount: ${error.message}`
      );
    }
  }

  // Calculate payment split amounts
  calculateSplit(
    totalAmount: number,
    adminPercentage = this.paystackAccountConfigService.getAdminSplitPercentage(),
  ) {
    const adminAmount = (totalAmount * adminPercentage) / 100;
    const sellerAmount = totalAmount - adminAmount;
    
    return {
      total: totalAmount,
      adminAmount: Math.round(adminAmount * 100) / 100, // Round to 2 decimal places
      sellerAmount: Math.round(sellerAmount * 100) / 100,
      adminPercentage,
      sellerPercentage: 100 - adminPercentage,
    };
  }

  // Get all pending subaccount requests for admin
  async getPendingSubaccounts() {
    try {
      const pendingSubaccounts = await this.paystackSubaccountRepository.findAll({
        where: { admin_approval_status: "pending" },
        include: [{ model: Store }],
        order: [["createdAt", "DESC"]],
      });

      return new DataResponseDto(
        pendingSubaccounts,
        true,
        "Pending subaccounts fetched successfully"
      );
    } 
    // catch (err) {
    //   throw new InternalServerErrorException(getErrorMessage(err));
    // }
      catch (error) {
      appLog.error("ERROR in getPendingSubaccounts:", error);
      throw error; // rethrow so Nest handles it
    }
  }

  // Get subaccount by store ID
  async getSubaccountByStore(storeId: number) {
    try {
      const subaccount = await this.paystackSubaccountRepository.findOne({
        where: { store_id: storeId },
        include: [{ model: Store }],
      });

      return new DataResponseDto(
        subaccount,
        true,
        "Subaccount fetched successfully"
      );
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Reject subaccount request
  async rejectSubaccount(subaccountId: number, adminUserId: number, reason?: string) {
    try {
      const subaccount = await this.paystackSubaccountRepository.findByPk(subaccountId);
      
      if (!subaccount) {
        throw new HttpException("Subaccount not found", HttpStatus.NOT_FOUND);
      }

      await subaccount.update({
        admin_approval_status: "rejected",
        admin_approved_by: adminUserId,
        admin_approved_at: new Date(),
        paystack_response: { rejection_reason: reason || "Rejected by admin" } as any,
      });

      // Update store status
      const store = await this.storeRepository.findByPk(subaccount.store_id);
      if (store) {
        await store.update({ subaccount_status: "rejected" });
      }

      return new DataResponseDto(subaccount, true, "Subaccount rejected successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Get list of Paystack supported banks
  async getSupportedBanks() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.paystackBaseUrl}/bank`, {
          headers: this.paystackAccountConfigService.getHeaders(),
        })
      );

      if (!response.data.status) {
        throw new Error(`Paystack API Error: ${response.data.message}`);
      }

      return new DataResponseDto(
        response.data.data,
        true,
        "Supported banks fetched successfully"
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch supported banks: ${error.message}`
      );
    }
  }

  // Validate bank account details with Paystack
  async validateBankAccount(accountNumber: string, bankCode: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.paystackBaseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
          {
            headers: this.paystackAccountConfigService.getHeaders(),
          }
        )
      );

      if (!response.data.status) {
        throw new HttpException(
          response.data.message || "Invalid bank account details",
          HttpStatus.BAD_REQUEST
        );
      }

      return new DataResponseDto(
        response.data.data,
        true,
        "Bank account validated successfully"
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      // Handle specific Paystack errors
      if (error.response?.data?.message) {
        throw new HttpException(
          error.response.data.message,
          HttpStatus.BAD_REQUEST
        );
      }
      
      throw new InternalServerErrorException(
        `Failed to validate bank account: ${error.message}`
      );
    }
  }

  // Validate if bank code is supported by Paystack
  async isBankSupported(bankCode: string) {
    try {
      const banksResponse = await this.getSupportedBanks();
      const supportedBanks = banksResponse.data;
      
      const bank = supportedBanks.find((bank: any) => bank.code === bankCode);
      
      return new DataResponseDto(
        {
          supported: !!bank,
          bank: bank || null,
        },
        true,
        bank ? "Bank is supported" : "Bank is not supported by Paystack"
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to check bank support: ${error.message}`
      );
    }
  }
}
