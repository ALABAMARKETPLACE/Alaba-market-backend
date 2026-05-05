import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { describe, expect, it, jest } from "@jest/globals";
import { ProductAttributes } from "../PRODUCT_SEARCH/attributes";
import { SellerBoosterService } from "./seller-booster.service";

describe("SellerBoosterService", () => {
  const transaction = { LOCK: { UPDATE: "UPDATE" } };

  const createPlan = (overrides: Record<string, any> = {}) => {
    const plan: any = {
      id: 11,
      store_id: 7,
      seller_id: 42,
      tier: "basic",
      status: "pending",
      product_limit: 5,
      duration_days: 30,
      starts_at: null,
      expires_at: null,
      paystack_reference: "seller_booster_ref",
      amount: 500000,
      boost_score: 30,
      price: 500000,
      currency: "NGN",
      is_unlimited: false,
      booster_plan_config_id: 3,
      selected_product_ids: [1, 2],
      update: jest.fn(async (payload: Record<string, any>) => {
        Object.assign(plan, payload);
        return plan;
      }),
      ...overrides,
    };

    return plan;
  };

  const createService = (overrides: Record<string, any> = {}) => {
    const planRepository = {
      sequelize: {
        transaction: jest.fn(async (callback: any) => callback(transaction)),
      },
      update: jest.fn(async () => [0]),
      create: jest.fn(async (payload: any) => createPlan({ ...payload, id: 99 })),
      findAll: jest.fn(async () => []),
      findOne: jest.fn(async () => null),
      findByPk: jest.fn(async () => null),
      ...overrides.planRepository,
    };
    const boostedProductRepository = {
      findAll: jest.fn(async () => []),
      update: jest.fn(async () => [0]),
      bulkCreate: jest.fn(async () => []),
      ...overrides.boostedProductRepository,
    };
    const boosterPlanConfigRepository = {
      findAll: jest.fn(async () => [
        {
          id: 1,
          name: "basic",
          display_name: "Basic",
          description: "Boost up to 5 selected active products.",
          product_limit: 5,
          boost_score: 30,
          duration_days: 30,
          price: 500000,
          currency: "NGN",
          is_active: true,
          is_unlimited: false,
        },
        {
          id: 2,
          name: "gold",
          display_name: "Gold",
          description: "Boost up to 20 selected active products.",
          product_limit: 20,
          boost_score: 60,
          duration_days: 30,
          price: 1500000,
          currency: "NGN",
          is_active: true,
          is_unlimited: false,
        },
        {
          id: 3,
          name: "premium",
          display_name: "Premium",
          description: "Boost all active products in your store.",
          product_limit: null,
          boost_score: 100,
          duration_days: 30,
          price: 5000000,
          currency: "NGN",
          is_active: true,
          is_unlimited: true,
        },
      ]),
      findOne: jest.fn(async ({ where }: any) => {
        const configs: Record<string, any> = {
          basic: {
            id: 1,
            name: "basic",
            product_limit: 5,
            boost_score: 30,
            duration_days: 30,
            price: 500000,
            currency: "NGN",
            is_active: true,
            is_unlimited: false,
          },
          gold: {
            id: 2,
            name: "gold",
            product_limit: 20,
            boost_score: 60,
            duration_days: 30,
            price: 1500000,
            currency: "NGN",
            is_active: true,
            is_unlimited: false,
          },
          premium: {
            id: 3,
            name: "premium",
            product_limit: null,
            boost_score: 100,
            duration_days: 30,
            price: 5000000,
            currency: "NGN",
            is_active: true,
            is_unlimited: true,
          },
        };
        return configs[where.name] || null;
      }),
      ...overrides.boosterPlanConfigRepository,
    };
    const productsRepository = {
      findAll: jest.fn(async () => []),
      update: jest.fn(async () => [0]),
      ...overrides.productsRepository,
    };
    const storeRepository = {
      findByPk: jest.fn(async () => ({
        id: 7,
        status: "approved",
      })),
      ...overrides.storeRepository,
    };
    const userRepository = {
      findByPk: jest.fn(async () => ({
        _id: 42,
        email: "seller@example.com",
        store_id: 7,
      })),
      ...overrides.userRepository,
    };
    const paystackService = {
      initializePayment: jest.fn(async () => ({
        authorization_url: "https://checkout.paystack.com/booster",
        access_code: "ACCESS_BOOSTER",
        reference: "seller_booster_ref",
      })),
      verifyPayment: jest.fn(async () => ({
        status: true,
        data: {
          status: "success",
          reference: "seller_booster_ref",
          amount: 500000,
          metadata: {
            checkout_type: "seller_booster",
            booster_plan_id: 11,
            store_id: 7,
            seller_id: 42,
            tier: "basic",
            product_ids: [1, 2],
          },
        },
      })),
      ...overrides.paystackService,
    };

    const service = new SellerBoosterService(
      planRepository as any,
      boostedProductRepository as any,
      boosterPlanConfigRepository as any,
      productsRepository as any,
      storeRepository as any,
      userRepository as any,
      paystackService as any,
    );

    return {
      service,
      planRepository,
      boostedProductRepository,
      boosterPlanConfigRepository,
      productsRepository,
      storeRepository,
      userRepository,
      paystackService,
    };
  };

  it("rejects basic plans with more than 5 selected products", async () => {
    const { service } = createService();

    await expect(
      service.initializePayment(42, 7, {
        tier: "basic",
        product_ids: [1, 2, 3, 4, 5, 6],
        duration_days: 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects gold plans with more than 20 selected products", async () => {
    const { service } = createService();

    await expect(
      service.initializePayment(42, 7, {
        tier: "gold",
        product_ids: Array.from({ length: 21 }, (_, index) => index + 1),
        duration_days: 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("uses the latest active database config when a seller initializes a plan", async () => {
    const latestBasicConfig = {
      id: 8,
      name: "basic",
      product_limit: 7,
      boost_score: 44,
      duration_days: 45,
      price: 750000,
      currency: "NGN",
      is_active: true,
      is_unlimited: false,
    };
    const { service, planRepository, paystackService } = createService({
      boosterPlanConfigRepository: {
        findOne: jest.fn(async () => latestBasicConfig),
      },
      productsRepository: {
        findAll: jest.fn(async () => [{ _id: 1 }, { _id: 2 }, { _id: 3 }]),
      },
    });

    await service.initializePayment(42, 7, {
      tier: "basic",
      product_ids: [1, 2, 3],
    });

    expect(planRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        product_limit: 7,
        boost_score: 44,
        duration_days: 45,
        price: 750000,
        amount: 750000,
        is_unlimited: false,
        booster_plan_config_id: 8,
      }),
    );
    expect(paystackService.initializePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 750000,
        metadata: expect.objectContaining({
          boost_score: 44,
          product_limit: 7,
          price: 750000,
        }),
      }),
    );
  });

  it("keeps an existing active plan on its original snapshot limits", async () => {
    const activePlan = createPlan({
      status: "active",
      product_limit: 5,
      boost_score: 30,
      is_unlimited: false,
      starts_at: new Date(),
      expires_at: new Date(Date.now() + 86400000),
    });
    const { service } = createService({
      planRepository: {
        findAll: jest.fn(async () => []),
        findOne: jest.fn(async () => activePlan),
      },
      boosterPlanConfigRepository: {
        findOne: jest.fn(async () => ({
          id: 1,
          name: "basic",
          product_limit: 10,
          boost_score: 80,
          duration_days: 60,
          price: 900000,
          currency: "NGN",
          is_active: true,
          is_unlimited: false,
        })),
      },
    });

    await expect(
      service.updateSelectedProducts(42, 7, {
        product_ids: [1, 2, 3, 4, 5, 6],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects products outside the seller store or inactive products", async () => {
    const { service, productsRepository } = createService({
      productsRepository: {
        findAll: jest.fn(async () => [{ _id: 1 }]),
      },
    });

    await expect(
      service.initializePayment(42, 7, {
        tier: "basic",
        product_ids: [1, 2],
        duration_days: 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(productsRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          store_id: 7,
          status: true,
        }),
      }),
    );
  });

  it("rejects sellers whose token store does not match the user store", async () => {
    const { service } = createService({
      storeRepository: {
        findByPk: jest.fn(async () => ({
          id: 99,
          status: "approved",
        })),
      },
    });

    await expect(
      service.initializePayment(42, 99, {
        tier: "basic",
        product_ids: [1],
        duration_days: 30,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("activates premium by boosting every active product in the store", async () => {
    const premiumPlan = createPlan({
      tier: "premium",
      product_limit: null,
      boost_score: 100,
      is_unlimited: true,
      selected_product_ids: null,
      amount: 5000000,
      price: 5000000,
    });
    const { service, boostedProductRepository, productsRepository } =
      createService({
        planRepository: {
          findOne: jest.fn(async () => premiumPlan),
        },
        productsRepository: {
          findAll: jest.fn(async () => [{ _id: 1 }, { _id: 2 }, { _id: 3 }]),
          update: jest.fn(async () => [3]),
        },
      });

    await expect(
      service.activateFromWebhook({
        status: "success",
        reference: "seller_booster_ref",
        amount: 5000000,
        metadata: {
          checkout_type: "seller_booster",
          booster_plan_id: 11,
          tier: "premium",
        },
      }),
    ).resolves.toBe(true);

    expect(boostedProductRepository.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ product_id: 1, boost_score: 100 }),
        expect.objectContaining({ product_id: 2, boost_score: 100 }),
        expect.objectContaining({ product_id: 3, boost_score: 100 }),
      ]),
      expect.any(Object),
    );
    expect(productsRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        is_boosted: true,
        boost_score: 100,
      }),
      expect.any(Object),
    );
  });

  it("verifies successful Paystack payment before activating booster", async () => {
    const plan = createPlan();
    const productsFindAll = jest.fn() as any;
    productsFindAll
      .mockResolvedValueOnce([{ _id: 1 }, { _id: 2 }])
      .mockResolvedValueOnce([{ _id: 1, name: "Boosted Product" }]);
    const { service, paystackService, boostedProductRepository } = createService({
      planRepository: {
        findOne: jest.fn(async () => plan),
        findByPk: jest.fn(async () => plan),
      },
      boostedProductRepository: {
        findAll: jest.fn(async () => [
          {
            id: 1,
            product_id: 1,
            tier: "basic",
            boost_score: 30,
            starts_at: new Date(),
            expires_at: new Date(Date.now() + 86400000),
            status: "active",
          },
        ]),
        update: jest.fn(async () => [0]),
        bulkCreate: jest.fn(async () => []),
      },
      productsRepository: {
        findAll: productsFindAll,
        update: jest.fn(async () => [2]),
      },
    });

    const result = await service.verifyAndActivate(
      42,
      7,
      "seller_booster_ref",
    );

    expect(paystackService.verifyPayment).toHaveBeenCalledWith({
      reference: "seller_booster_ref",
    });
    expect(boostedProductRepository.bulkCreate).toHaveBeenCalled();
    expect(result.data.boosted_product_count).toBe(1);
  });

  it("expires plans and clears product boost fields", async () => {
    const expiredPlan = createPlan({
      status: "active",
      starts_at: new Date(Date.now() - 3 * 86400000),
      expires_at: new Date(Date.now() - 86400000),
    });
    const { service, boostedProductRepository, productsRepository } =
      createService({
        planRepository: {
          findAll: jest.fn(async () => [expiredPlan]),
        },
        boostedProductRepository: {
          findAll: jest.fn(async () => [
            { product_id: 1, status: "active" },
            { product_id: 2, status: "active" },
          ]),
          update: jest.fn(async () => [2]),
          bulkCreate: jest.fn(async () => []),
        },
        productsRepository: {
          update: jest.fn(async () => [2]),
        },
      });

    await expect(service.expireExpiredBoosters()).resolves.toBe(1);

    expect(expiredPlan.update).toHaveBeenCalledWith(
      { status: "expired" },
      expect.any(Object),
    );
    expect(boostedProductRepository.update).toHaveBeenCalledWith(
      { status: "expired" },
      expect.any(Object),
    );
    expect(productsRepository.update).toHaveBeenCalledWith(
      {
        is_boosted: false,
        boost_score: 0,
        boosted_until: null,
      },
      expect.any(Object),
    );
  });

  it("cancels active booster and removes boosted status", async () => {
    const activePlan = createPlan({
      status: "active",
      starts_at: new Date(),
      expires_at: new Date(Date.now() + 86400000),
    });
    const boostedFindAll = jest.fn() as any;
    boostedFindAll
      .mockResolvedValueOnce([{ product_id: 1, status: "active" }])
      .mockResolvedValueOnce([]);
    const { service, boostedProductRepository, productsRepository } =
      createService({
        planRepository: {
          findAll: jest.fn(async () => []),
          findOne: jest.fn(async () => activePlan),
          findByPk: jest.fn(async () => activePlan),
        },
        boostedProductRepository: {
          findAll: boostedFindAll,
          update: jest.fn(async () => [1]),
          bulkCreate: jest.fn(async () => []),
        },
        productsRepository: {
          findAll: jest.fn(async () => []),
          update: jest.fn(async () => [1]),
        },
      });

    await service.cancel(42, 7);

    expect(activePlan.update).toHaveBeenCalledWith(
      { status: "cancelled" },
      expect.any(Object),
    );
    expect(boostedProductRepository.update).toHaveBeenCalledWith(
      { status: "cancelled" },
      expect.any(Object),
    );
    expect(productsRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        is_boosted: false,
        boost_score: 0,
      }),
      expect.any(Object),
    );
  });

  it("orders product feeds by active boost score before normal ordering", () => {
    const order = new ProductAttributes().productOrder(null, null, null);
    const firstOrderExpression = String((order[0][0] as any).val || "");

    expect(order[0][1]).toBe("DESC");
    expect(firstOrderExpression).toContain("boost_score");
    expect(firstOrderExpression).toContain("boosted_until");
    expect(order).toEqual(
      expect.arrayContaining([["createdAt", "DESC"]]),
    );
  });
});
