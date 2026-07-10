import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { of, throwError } from "rxjs";
import { PaystackSubaccountMigrationService } from "./paystack-subaccount-migration.service";

describe("PaystackSubaccountMigrationService", () => {
  const buildStore = (overrides: Record<string, any> = {}) => {
    const store: Record<string, any> = {
      id: 7,
      name: "Seller Owner",
      email: "seller@example.com",
      phone: "08012345678",
      store_name: "Seller Store",
      business_name: "Seller Store Ltd",
      settlement_bank: "058",
      settlement_account_number: "0123456789",
      primary_contact_email: "seller@example.com",
      primary_contact_name: "Seller Owner",
      primary_contact_phone: "08012345678",
      percentage_charge: 95,
      settlement_schedule: "auto",
      paystack_subaccount_code: "ACCT_LEGACY_123",
      paystack_subaccount_code_old: "ACCT_LEGACY_123",
      paystack_subaccount_code_new: null,
      paystack_subaccount_migration_status: "pending",
      update: jest.fn(async (payload: Record<string, any>) => {
        Object.assign(store, payload);
      }),
      set: jest.fn((payload: Record<string, any>) => {
        Object.assign(store, payload);
      }),
      save: jest.fn(async () => undefined),
    };

    return Object.assign(store, overrides);
  };

  let httpService: { post: any; get: any };
  let storeRepository: any;
  let paystackAccountConfigService: { getHeaders: any; getSellerSplitPercentage: any };
  let service: PaystackSubaccountMigrationService;

  beforeEach(() => {
    httpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    storeRepository = {
      findByPk: jest.fn(),
      findAll: jest.fn(),
      findAndCountAll: jest.fn(),
      count: jest.fn(),
      sequelize: {
        transaction: jest.fn(async (handler: any) => handler({})),
      },
    };

    paystackAccountConfigService = {
      getHeaders: jest.fn(() => ({
        Authorization: "Bearer sk_test_new_123",
        "Content-Type": "application/json",
      })),
      getSellerSplitPercentage: jest.fn(() => 93.5),
    };

    service = new PaystackSubaccountMigrationService(
      storeRepository,
      httpService as any,
      paystackAccountConfigService as any,
    );
  });

  it("skips stores that already have a new subaccount code", async () => {
    const store = buildStore({
      paystack_subaccount_code_new: "ACCT_NEW_123",
      paystack_subaccount_migration_status: "success",
    });
    storeRepository.findByPk.mockResolvedValue(store);

    const result = await service.migrateStoreById(store.id, {});

    expect(result.data.result).toBe("skipped");
    expect(httpService.post).not.toHaveBeenCalled();
    expect(store.update).not.toHaveBeenCalled();
  });

  it("does not write to the database during a dry run", async () => {
    const store = buildStore();
    storeRepository.findByPk.mockResolvedValue(store);

    const result = await service.migrateStoreById(store.id, { dryRun: true });

    expect(result.data.result).toBe("preview");
    expect(httpService.post).not.toHaveBeenCalled();
    expect(store.update).not.toHaveBeenCalled();
  });

  it("stores a failure when Paystack creation fails", async () => {
    const store = buildStore();
    storeRepository.findByPk.mockResolvedValue(store);
    httpService.post.mockReturnValue(
      throwError(() => ({
        response: {
          status: 400,
          data: {
            message: "Invalid account number",
          },
        },
      })),
    );

    const result = await service.migrateStoreById(store.id, {});

    expect(result.data.result).toBe("failed");
    expect(store.set).toHaveBeenCalledWith(
      expect.objectContaining({
        paystack_subaccount_migration_status: "failed",
        paystack_subaccount_migration_error:
          "[400] Invalid account number",
      }),
    );
    expect(store.save).toHaveBeenCalledWith(expect.any(Object));
  });

  it("updates the store when migration succeeds", async () => {
    const store = buildStore();
    storeRepository.findByPk.mockResolvedValue(store);
    httpService.post.mockReturnValue(
      of({
        data: {
          status: true,
          data: {
            id: 901,
            subaccount_code: "ACCT_NEW_901",
          },
        },
      }),
    );

    const result = await service.migrateStoreById(store.id, {});

    expect(result.data.result).toBe("success");
    expect(paystackAccountConfigService.getHeaders).toHaveBeenCalledWith("new");
    expect(paystackAccountConfigService.getSellerSplitPercentage).toHaveBeenCalledWith("new");
    expect(httpService.post).toHaveBeenCalledWith(
      expect.stringContaining("/subaccount"),
      expect.objectContaining({
        percentage_charge: 6.5,
      }),
      expect.any(Object),
    );
    expect(store.set).toHaveBeenCalledWith(
      expect.objectContaining({
        paystack_subaccount_code_old: "ACCT_LEGACY_123",
        paystack_subaccount_code_new: "ACCT_NEW_901",
        paystack_subaccount_migration_status: "success",
        paystack_subaccount_migration_error: undefined,
      }),
    );
    expect(store.save).toHaveBeenCalledWith(expect.any(Object));
  });

  it("syncs copied new-account subaccounts back into local stores", async () => {
    const store = buildStore({
      paystack_subaccount_code_new: null,
      paystack_subaccount_migration_status: "pending",
    });
    storeRepository.findAll.mockResolvedValue([store]);
    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              id: 3001,
              subaccount_code: "ACCT_NEW_SYNCED",
              business_name: "Seller Store Ltd",
              primary_contact_email: "seller@example.com",
              primary_contact_phone: "08012345678",
              account_number: "0123456789",
              percentage_charge: 6.5,
            },
          ],
          meta: {
            pageCount: 1,
          },
        },
      }),
    );

    const result = await service.syncExistingNewSubaccounts({
      dryRun: false,
      perPage: 100,
      includeResults: true,
    });

    expect(httpService.get).toHaveBeenCalledWith(
      expect.stringContaining("/subaccount?perPage=100&page=1"),
      expect.objectContaining({
        headers: expect.any(Object),
      }),
    );
    expect(paystackAccountConfigService.getHeaders).toHaveBeenCalledWith("new");
    expect(store.set).toHaveBeenCalledWith(
      expect.objectContaining({
        paystack_subaccount_code_new: "ACCT_NEW_SYNCED",
        paystack_subaccount_id: 3001,
        paystack_subaccount_migration_status: "success",
        percentage_charge: 93.5,
      }),
    );
    expect(store.save).toHaveBeenCalledWith(expect.any(Object));
    expect(result.data.summary.updated).toBe(1);
    expect(result.data.results[0]).toEqual(
      expect.objectContaining({
        result: "updated",
        store_id: 7,
        subaccount_code: "ACCT_NEW_SYNCED",
        seller_percentage_charge: 93.5,
        company_percentage_charge: 6.5,
      }),
    );
  });

  it("marks duplicate remote matches for the same store as ambiguous", async () => {
    const store = buildStore({
      id: 3198,
      store_name: "Social Electrical Store",
      business_name: "Social Electrical Store",
      settlement_account_number: "0123456789",
      paystack_subaccount_code_new: null,
    });

    storeRepository.findAll.mockResolvedValue([store]);
    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              id: 3001,
              subaccount_code: "ACCT_FIRST",
              business_name: "Social Electrical Store",
              primary_contact_email: "seller@example.com",
              primary_contact_phone: "08012345678",
              account_number: "0123456789",
              percentage_charge: 95,
            },
            {
              id: 3002,
              subaccount_code: "ACCT_SECOND",
              business_name: "Social Electrical Store",
              primary_contact_email: "seller@example.com",
              primary_contact_phone: "08012345678",
              account_number: "0123456789",
              percentage_charge: 95,
            },
          ],
          meta: {
            pageCount: 1,
          },
        },
      }),
    );

    const result = await service.syncExistingNewSubaccounts({
      dryRun: false,
      perPage: 100,
      includeResults: true,
    });

    expect(store.update).not.toHaveBeenCalled();
    expect(result.data.summary.matched).toBe(0);
    expect(result.data.summary.updated).toBe(0);
    expect(result.data.summary.ambiguous).toBe(2);
    expect(result.data.results).toEqual([
      expect.objectContaining({
        result: "ambiguous",
        subaccount_code: "ACCT_FIRST",
        candidate_store_ids: [3198],
        reason: "multiple_remote_subaccounts_matched_same_store",
      }),
      expect.objectContaining({
        result: "ambiguous",
        subaccount_code: "ACCT_SECOND",
        candidate_store_ids: [3198],
        reason: "multiple_remote_subaccounts_matched_same_store",
      }),
    ]);
  });
});
