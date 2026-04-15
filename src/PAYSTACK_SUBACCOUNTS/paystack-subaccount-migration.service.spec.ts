import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { of, throwError } from "rxjs";
import { PaystackSubaccountMigrationService } from "./paystack-subaccount-migration.service";

describe("PaystackSubaccountMigrationService", () => {
  const buildStore = (overrides: Record<string, any> = {}) => ({
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
    update: jest.fn(async () => undefined),
    ...overrides,
  });

  let httpService: { post: any };
  let storeRepository: any;
  let paystackAccountConfigService: { getHeaders: any };
  let service: PaystackSubaccountMigrationService;

  beforeEach(() => {
    httpService = {
      post: jest.fn(),
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
    expect(store.update).toHaveBeenCalledWith(
      expect.objectContaining({
        paystack_subaccount_migration_status: "failed",
        paystack_subaccount_migration_error:
          "[400] Invalid account number",
      }),
      expect.any(Object),
    );
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
    expect(store.update).toHaveBeenCalledWith(
      expect.objectContaining({
        paystack_subaccount_code_old: "ACCT_LEGACY_123",
        paystack_subaccount_code_new: "ACCT_NEW_901",
        paystack_subaccount_migration_status: "success",
        paystack_subaccount_migration_error: null,
      }),
      expect.any(Object),
    );
  });
});
