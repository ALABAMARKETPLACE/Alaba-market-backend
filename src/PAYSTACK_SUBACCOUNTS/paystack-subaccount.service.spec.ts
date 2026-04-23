import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { of } from "rxjs";
import { PaystackSubaccountService } from "./paystack-subaccount.service";

describe("PaystackSubaccountService", () => {
  let paystackSubaccountRepository: any;
  let storeRepository: any;
  let httpService: any;
  let paystackAccountConfigService: any;
  let service: PaystackSubaccountService;

  beforeEach(() => {
    paystackSubaccountRepository = {
      findOne: jest.fn(),
    };

    storeRepository = {
      findAll: jest.fn(),
      sequelize: {
        transaction: jest.fn(async (handler: any) => handler({})),
      },
    };

    httpService = {
      get: jest.fn(),
      put: jest.fn(),
    };

    paystackAccountConfigService = {
      getHeaders: jest.fn(() => ({
        Authorization: "Bearer sk_test_new_123",
        "Content-Type": "application/json",
      })),
      getSellerSplitPercentage: jest.fn(() => 93.5),
    };

    service = new PaystackSubaccountService(
      paystackSubaccountRepository,
      storeRepository,
      httpService,
      paystackAccountConfigService,
    );
  });

  it("generates a preview without calling paystack when dryRun is true", async () => {
    storeRepository.findAll.mockResolvedValue([
      {
        id: 4548,
        store_name: "Seller Store",
        business_name: "Seller Store",
        settlement_account_number: "0123456789",
        primary_contact_email: "seller@example.com",
        primary_contact_phone: "08012345678",
        paystack_subaccount_code_new: "ACCT_NEW_4548",
        percentage_charge: 95,
      },
    ]);
    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              subaccount_code: "ACCT_NEW_4548",
              business_name: "Seller Store",
              primary_contact_email: "seller@example.com",
              primary_contact_phone: "08012345678",
              account_number: "0123456789",
            },
          ],
          meta: { pageCount: 1 },
        },
      }),
    );

    const result = await service.bulkUpdateNewAccountSubaccountPercentages({
      dryRun: true,
    });

    expect(paystackAccountConfigService.getSellerSplitPercentage).toHaveBeenCalledWith("new");
    expect(httpService.get).toHaveBeenCalled();
    expect(httpService.put).not.toHaveBeenCalled();
    expect(result.data.summary.preview).toBe(1);
    expect(result.data.summary.remote_total).toBe(1);
    expect(result.data.summary.local_targetable_total).toBe(1);
    expect(result.data.summary.targeted_remote_total).toBe(1);
    expect(result.data.summary.unmatched_remote_total).toBe(0);
    expect(result.data.summary.failed_store_ids).toEqual([]);
    expect(result.data.results[0]).toEqual(
      expect.objectContaining({
        store_id: 4548,
        result: "preview",
        target_subaccount_codes: ["ACCT_NEW_4548"],
        next_percentage_charge: 93.5,
        company_percentage: 6.5,
        paystack_percentage_charge: 6.5,
      }),
    );
  });

  it("updates paystack and local records for matching stores", async () => {
    const storeUpdate = jest.fn(async () => undefined);
    const subaccountUpdate = jest.fn(async () => undefined);

    storeRepository.findAll.mockResolvedValue([
      {
        id: 4548,
        store_name: "Seller Store",
        business_name: "Seller Store",
        settlement_account_number: "0123456789",
        primary_contact_email: "seller@example.com",
        primary_contact_phone: "08012345678",
        paystack_subaccount_code_new: "ACCT_NEW_4548",
        percentage_charge: 95,
        update: storeUpdate,
      },
    ]);
    paystackSubaccountRepository.findOne.mockResolvedValue({
      update: subaccountUpdate,
    });
    httpService.put.mockReturnValue(
      of({
        data: {
          status: true,
          data: {
            subaccount_code: "ACCT_NEW_4548",
            percentage_charge: 93.5,
          },
        },
      }),
    );
    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              subaccount_code: "ACCT_NEW_4548",
              business_name: "Seller Store",
              primary_contact_email: "seller@example.com",
              primary_contact_phone: "08012345678",
              account_number: "0123456789",
            },
          ],
          meta: { pageCount: 1 },
        },
      }),
    );

    const result = await service.bulkUpdateNewAccountSubaccountPercentages({
      percentage_charge: 93.5,
      storeIds: [4548],
    });

    expect(storeRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: expect.any(Object),
          paystack_subaccount_code_new: expect.any(Object),
        }),
      }),
    );
    expect(httpService.put).toHaveBeenCalledWith(
      "https://api.paystack.co/subaccount/ACCT_NEW_4548",
      {
        percentage_charge: 6.5,
      },
      {
        headers: {
          Authorization: "Bearer sk_test_new_123",
          "Content-Type": "application/json",
        },
      },
    );
    expect(paystackAccountConfigService.getHeaders).toHaveBeenCalledWith("new");
    expect(storeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        percentage_charge: 93.5,
      }),
      expect.any(Object),
    );
    expect(subaccountUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        percentage_charge: 93.5,
      }),
      expect.any(Object),
    );
    expect(result.data.summary.updated).toBe(1);
    expect(result.data.summary.remote_total).toBe(1);
    expect(result.data.summary.local_targetable_total).toBe(1);
    expect(result.data.summary.targeted_remote_total).toBe(1);
    expect(result.data.summary.unmatched_remote_total).toBe(0);
    expect(result.data.summary.failed_store_ids).toEqual([]);
    expect(result.data.results[0]).toEqual(
      expect.objectContaining({
        store_id: 4548,
        result: "updated",
        target_subaccount_codes: ["ACCT_NEW_4548"],
        percentage_charge: 93.5,
        paystack_percentage_charge: 6.5,
      }),
    );
  });

  it("updates duplicate live subaccounts that match the same store", async () => {
    const storeUpdate = jest.fn(async () => undefined);

    storeRepository.findAll.mockResolvedValue([
      {
        id: 3194,
        store_name: "Chommy chocolate",
        business_name: "Chommy chocolate",
        settlement_account_number: "2164794011",
        primary_contact_email: "seller@example.com",
        primary_contact_phone: "08012345678",
        paystack_subaccount_code_new: "ACCT_PRIMARY",
        percentage_charge: 95,
        update: storeUpdate,
      },
    ]);
    paystackSubaccountRepository.findOne.mockResolvedValue(null);
    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              subaccount_code: "ACCT_PRIMARY",
              business_name: "Chommy chocolate",
              primary_contact_email: "seller@example.com",
              primary_contact_phone: "08012345678",
              account_number: "2164794011",
            },
            {
              subaccount_code: "ACCT_DUPLICATE",
              business_name: "Chommy chocolate",
              primary_contact_email: "seller@example.com",
              primary_contact_phone: "08012345678",
              account_number: "2164794011",
            },
          ],
          meta: { pageCount: 1 },
        },
      }),
    );
    httpService.put.mockReturnValue(
      of({
        data: {
          status: true,
          data: {
            percentage_charge: 6.5,
          },
        },
      }),
    );

    const result = await service.bulkUpdateNewAccountSubaccountPercentages({
      percentage_charge: 93.5,
      storeIds: [3194],
    });

    expect(httpService.put).toHaveBeenCalledTimes(2);
    expect(httpService.put).toHaveBeenNthCalledWith(
      1,
      "https://api.paystack.co/subaccount/ACCT_PRIMARY",
      { percentage_charge: 6.5 },
      expect.any(Object),
    );
    expect(httpService.put).toHaveBeenNthCalledWith(
      2,
      "https://api.paystack.co/subaccount/ACCT_DUPLICATE",
      { percentage_charge: 6.5 },
      expect.any(Object),
    );
    expect(result.data.summary.remote_total).toBe(2);
    expect(result.data.summary.local_targetable_total).toBe(1);
    expect(result.data.summary.targeted_remote_total).toBe(2);
    expect(result.data.summary.unmatched_remote_total).toBe(0);
    expect(result.data.summary.failed_store_ids).toEqual([]);
    expect(result.data.results[0]).toEqual(
      expect.objectContaining({
        result: "updated",
        target_subaccount_codes: ["ACCT_PRIMARY", "ACCT_DUPLICATE"],
      }),
    );
  });

  it("lists unmatched remote subaccounts", async () => {
    storeRepository.findAll.mockResolvedValue([
      {
        id: 4548,
        store_name: "Seller Store",
        business_name: "Seller Store",
        settlement_account_number: "0123456789",
        primary_contact_email: "seller@example.com",
        primary_contact_phone: "08012345678",
        paystack_subaccount_code_new: "ACCT_MATCHED",
      },
      {
        id: 5001,
        store_name: "Recoverable Store",
        business_name: "Recoverable Store",
        settlement_account_number: "0999999999",
        primary_contact_email: "orphan@example.com",
        primary_contact_phone: "08099999999",
        paystack_subaccount_code_new: null,
      },
    ]);
    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              subaccount_code: "ACCT_MATCHED",
              business_name: "Seller Store",
              primary_contact_email: "seller@example.com",
              primary_contact_phone: "08012345678",
              account_number: "0123456789",
            },
            {
              subaccount_code: "ACCT_UNMATCHED",
              business_name: "Orphan Store",
              primary_contact_email: "orphan@example.com",
              primary_contact_phone: "08099999999",
              account_number: "0999999999",
            },
          ],
          meta: { pageCount: 1 },
        },
      }),
    );

    const result = await service.getUnmatchedRemoteSubaccounts({
      page: 1,
      limit: 50,
    });

    expect(result.data.summary).toEqual(
      expect.objectContaining({
        remote_total: 2,
        local_store_total: 1,
        local_targetable_total: 1,
        targeted_remote_total: 1,
        unmatched_remote_total: 1,
        page: 1,
        limit: 50,
      }),
    );
    expect(result.data.items).toEqual([
      expect.objectContaining({
        subaccount_code: "ACCT_UNMATCHED",
        business_name: "Orphan Store",
        account_number: "0999999999",
        classification: "missing_local_link",
        candidate_store_ids: [5001],
        reason: "single_local_store_matches_account_number_but_has_no_new_code",
      }),
    ]);
  });

  it("classifies true orphan remote subaccounts", async () => {
    storeRepository.findAll.mockResolvedValue([
      {
        id: 4548,
        store_name: "Seller Store",
        business_name: "Seller Store",
        settlement_account_number: "0123456789",
        primary_contact_email: "seller@example.com",
        primary_contact_phone: "08012345678",
        paystack_subaccount_code_new: "ACCT_MATCHED",
      },
    ]);
    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              subaccount_code: "ACCT_MATCHED",
              business_name: "Seller Store",
              primary_contact_email: "seller@example.com",
              primary_contact_phone: "08012345678",
              account_number: "0123456789",
            },
            {
              subaccount_code: "ACCT_ORPHAN",
              business_name: "Unknown Store",
              primary_contact_email: "unknown@example.com",
              primary_contact_phone: "08000000000",
              account_number: "0000000000",
            },
          ],
          meta: { pageCount: 1 },
        },
      }),
    );

    const result = await service.getUnmatchedRemoteSubaccounts({
      page: 1,
      limit: 50,
    });

    expect(result.data.items).toEqual([
      expect.objectContaining({
        subaccount_code: "ACCT_ORPHAN",
        classification: "orphan",
        candidate_store_ids: [],
        reason: "no_local_store_with_matching_account_number",
      }),
    ]);
  });

  it("previews safe resolution for missing_local_link unmatched records", async () => {
    storeRepository.findAll.mockResolvedValue([
      {
        id: 4548,
        store_name: "Seller Store",
        business_name: "Seller Store",
        settlement_account_number: "0123456789",
        primary_contact_email: "seller@example.com",
        primary_contact_phone: "08012345678",
        paystack_subaccount_code_new: "ACCT_MATCHED",
      },
      {
        id: 5001,
        store_name: "Recoverable Store",
        business_name: "Recoverable Store",
        settlement_account_number: "0999999999",
        primary_contact_email: "orphan@example.com",
        primary_contact_phone: "08099999999",
        paystack_subaccount_code_new: null,
      },
    ]);
    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              id: 11,
              subaccount_code: "ACCT_MATCHED",
              business_name: "Seller Store",
              primary_contact_email: "seller@example.com",
              primary_contact_phone: "08012345678",
              account_number: "0123456789",
              percentage_charge: 6.5,
            },
            {
              id: 22,
              subaccount_code: "ACCT_RECOVER",
              business_name: "Orphan Store",
              primary_contact_email: "orphan@example.com",
              primary_contact_phone: "08099999999",
              account_number: "0999999999",
              percentage_charge: 6.5,
            },
          ],
          meta: { pageCount: 1 },
        },
      }),
    );

    const result = await service.resolveUnmatchedRemoteSubaccounts({
      dryRun: true,
    });

    expect(result.data.summary).toEqual(
      expect.objectContaining({
        unmatched_remote_total: 1,
        resolvable_total: 1,
        preview: 1,
        resolved: 0,
        failed: 0,
      }),
    );
    expect(result.data.results).toEqual([
      expect.objectContaining({
        result: "preview",
        classification: "missing_local_link",
        subaccount_code: "ACCT_RECOVER",
        candidate_store_id: 5001,
        next_percentage_charge: 93.5,
      }),
    ]);
  });

  it("links safe missing_local_link unmatched records", async () => {
    const storeUpdate = jest.fn(async () => undefined);

    storeRepository.findAll.mockResolvedValue([
      {
        id: 4548,
        store_name: "Seller Store",
        business_name: "Seller Store",
        settlement_account_number: "0123456789",
        primary_contact_email: "seller@example.com",
        primary_contact_phone: "08012345678",
        paystack_subaccount_code_new: "ACCT_MATCHED",
      },
      {
        id: 5001,
        store_name: "Recoverable Store",
        business_name: "Recoverable Store",
        settlement_account_number: "0999999999",
        primary_contact_email: "orphan@example.com",
        primary_contact_phone: "08099999999",
        paystack_subaccount_code_new: null,
        paystack_subaccount_code: "ACCT_OLD_LOCAL",
        paystack_subaccount_code_old: null,
        update: storeUpdate,
      },
    ]);
    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              id: 11,
              subaccount_code: "ACCT_MATCHED",
              business_name: "Seller Store",
              primary_contact_email: "seller@example.com",
              primary_contact_phone: "08012345678",
              account_number: "0123456789",
              percentage_charge: 6.5,
            },
            {
              id: 22,
              subaccount_code: "ACCT_RECOVER",
              business_name: "Orphan Store",
              primary_contact_email: "orphan@example.com",
              primary_contact_phone: "08099999999",
              account_number: "0999999999",
              percentage_charge: 6.5,
            },
          ],
          meta: { pageCount: 1 },
        },
      }),
    );

    const result = await service.resolveUnmatchedRemoteSubaccounts({
      dryRun: false,
    });

    expect(storeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        paystack_subaccount_code_old: "ACCT_OLD_LOCAL",
        paystack_subaccount_code_new: "ACCT_RECOVER",
        paystack_subaccount_id: 22,
        paystack_subaccount_migration_status: "success",
        percentage_charge: 93.5,
      }),
      expect.any(Object),
    );
    expect(result.data.summary).toEqual(
      expect.objectContaining({
        resolvable_total: 1,
        resolved: 1,
        failed: 0,
      }),
    );
    expect(result.data.results).toEqual([
      expect.objectContaining({
        result: "resolved",
        classification: "missing_local_link",
        subaccount_code: "ACCT_RECOVER",
        candidate_store_id: 5001,
        percentage_charge: 93.5,
      }),
    ]);
  });
});
