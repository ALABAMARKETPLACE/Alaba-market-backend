import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { of } from "rxjs";

import { BudPaySubaccountMigrationService } from "./budpay-subaccount-migration.service";

describe("BudPaySubaccountMigrationService", () => {
  const buildStore = (overrides: Record<string, any> = {}) => {
    const store: Record<string, any> = {
      id: 7,
      first_name: "Seller",
      last_name: "Owner",
      name: "Seller Owner",
      email: "seller@example.com",
      phone: "08012345678",
      store_name: "Seller Store",
      business_name: "Seller Store Ltd",
      settlement_bank: "058",
      settlement_account_number: "0123456789",
      settlement_account_name: "SELLER OWNER",
      primary_contact_email: "seller@example.com",
      primary_contact_phone: "08012345678",
      subaccount_status: "active",
      paystack_subaccount_code_new: "ACCT_NEW_7",
      paystack_subaccount_code: "ACCT_OLD_7",
      budpay_customer_id: null,
      budpay_virtual_account_id: null,
      budpay_subaccount_id: null,
      budpay_import_status: "pending",
      update: jest.fn(async (payload: Record<string, any>) => {
        Object.assign(store, payload);
      }),
    };
    return Object.assign(store, overrides);
  };

  let storeRepository: any;
  let httpService: any;
  let accountConfigService: any;
  let paystackImportService: any;
  let service: BudPaySubaccountMigrationService;

  beforeEach(() => {
    storeRepository = {
      findAll: jest.fn(),
    };
    httpService = {
      get: jest.fn(),
      post: jest.fn(),
    };
    accountConfigService = {
      getBaseUrl: jest.fn(() => "https://api.budpay.com/api/v2"),
      getHeaders: jest.fn(() => ({
        Authorization: "Bearer budpay-secret",
        "Content-Type": "application/json",
      })),
    };
    paystackImportService = {
      fetchSubaccount: jest.fn(async () => null),
    };
    service = new BudPaySubaccountMigrationService(
      storeRepository,
      httpService,
      accountConfigService,
      paystackImportService,
    );
  });

  it("previews eligible stores without mutating them", async () => {
    const store = buildStore();
    storeRepository.findAll.mockResolvedValue([store]);

    const result = await service.preview();

    expect(result.data.summary).toEqual(
      expect.objectContaining({
        total_eligible: 1,
        ready_to_import: 1,
      }),
    );
    expect(result.data.stores[0].result).toBe("ready");
    expect(store.update).not.toHaveBeenCalled();
    expect(httpService.post).not.toHaveBeenCalled();
  });

  it("skips stores that already have BudPay identifiers", async () => {
    const store = buildStore({
      budpay_customer_id: 1007,
      budpay_import_status: "success",
    });
    storeRepository.findAll.mockResolvedValue([store]);

    const result = await service.import({});

    expect(result.data.summary.skipped).toBe(1);
    expect(result.data.results[0]).toEqual(
      expect.objectContaining({
        result: "skipped",
        reason: "already_imported",
      }),
    );
    expect(store.update).not.toHaveBeenCalled();
    expect(httpService.get).not.toHaveBeenCalled();
    expect(httpService.post).not.toHaveBeenCalled();
  });

  it("marks missing settlement bank details as failed", async () => {
    const store = buildStore({
      settlement_bank: null,
      settlement_account_number: null,
      settlement_account_name: null,
      account_number: null,
      account_name_or_code: null,
    });
    storeRepository.findAll.mockResolvedValue([store]);

    const result = await service.import({});

    expect(result.data.summary.failed).toBe(1);
    expect(store.update).toHaveBeenCalledWith(
      expect.objectContaining({
        budpay_import_status: "failed",
        budpay_import_error: expect.stringContaining("bank_code"),
      }),
    );
    expect(httpService.post).not.toHaveBeenCalled();
  });

  it("saves the BudPay customer and virtual-account response on success", async () => {
    const store = buildStore();
    storeRepository.findAll.mockResolvedValue([store]);
    paystackImportService.fetchSubaccount.mockResolvedValue({
      subaccount_code: "ACCT_NEW_7",
      business_name: "Seller Store Ltd",
      settlement_bank: { code: "058", name: "GTBank" },
      account_number: "0123456789",
      account_name: "SELLER OWNER",
    });
    httpService.get.mockReturnValue(
      of({ data: { status: true, data: [] } }),
    );
    httpService.post
      .mockReturnValueOnce(
        of({
          data: {
            status: true,
            data: {
              id: 501,
              customer_code: "CUS_SELLER_7",
              email: "seller@example.com",
            },
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            status: true,
            data: {
              id: 901,
              account_number: "1234567890",
              bank: { name: "Wema Bank" },
              customer: {
                id: 501,
                customer_code: "CUS_SELLER_7",
              },
            },
          },
        }),
      );

    const result = await service.import({});

    expect(result.data.summary.imported).toBe(1);
    expect(httpService.post).toHaveBeenNthCalledWith(
      1,
      "https://api.budpay.com/api/v2/customer",
      expect.objectContaining({
        email: "seller@example.com",
        metadata: expect.objectContaining({
          alaba_store_reference: "alaba_store_7",
        }),
      }),
      expect.any(Object),
    );
    expect(store.update).toHaveBeenCalledWith(
      expect.objectContaining({
        budpay_customer_id: 501,
        budpay_virtual_account_id: 901,
        budpay_account_number: "1234567890",
        budpay_bank_name: "Wema Bank",
        budpay_import_status: "success",
        budpay_raw_response: expect.objectContaining({
          mode: "seller_payout_profile_with_virtual_account",
          deterministic_reference: "alaba_store_7",
        }),
      }),
    );
  });

  it("continues importing after one store fails validation", async () => {
    const invalidStore = buildStore({
      id: 7,
      settlement_bank: null,
      settlement_account_number: null,
      settlement_account_name: null,
      account_number: null,
      account_name_or_code: null,
    });
    const validStore = buildStore({
      id: 8,
      email: "seller8@example.com",
      primary_contact_email: "seller8@example.com",
      paystack_subaccount_code_new: "ACCT_NEW_8",
    });
    storeRepository.findAll.mockResolvedValue([invalidStore, validStore]);
    httpService.get.mockReturnValue(
      of({ data: { status: true, data: [] } }),
    );
    httpService.post
      .mockReturnValueOnce(
        of({
          data: {
            status: true,
            data: { id: 508, customer_code: "CUS_SELLER_8" },
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            status: true,
            data: {
              id: 908,
              account_number: "1234567808",
              bank: { name: "Wema Bank" },
              customer: { id: 508, customer_code: "CUS_SELLER_8" },
            },
          },
        }),
      );

    const result = await service.import({});

    expect(result.data.summary).toEqual({
      imported: 1,
      skipped: 0,
      failed: 1,
    });
    expect(invalidStore.update).toHaveBeenCalledWith(
      expect.objectContaining({ budpay_import_status: "failed" }),
    );
    expect(validStore.update).toHaveBeenCalledWith(
      expect.objectContaining({ budpay_import_status: "success" }),
    );
  });
});
