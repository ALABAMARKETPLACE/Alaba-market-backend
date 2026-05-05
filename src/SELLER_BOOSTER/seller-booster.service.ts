import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Op, Transaction } from "sequelize";
import { PaystackService } from "../PAYSTACK_PAYMENT/paystack.service";
import { Products } from "../PRODUCTS/products.entity";
import { Store } from "../STORE/store.entity";
import { User } from "../USERS/user.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { BoostedProduct } from "./boosted-product.entity";
import { BoosterPlanConfig } from "./booster-plan-config.entity";
import { InitializeBoosterDto } from "./dto/initialize-booster.dto";
import { UpdateBoostedProductsDto } from "./dto/update-boosted-products.dto";
import {
  BoostedProductStatus,
  SELLER_BOOSTER_CHECKOUT_TYPE,
  SellerBoosterPlanStatus,
  SellerBoosterTier,
} from "./seller-booster.constants";
import { SellerBoosterPlan } from "./seller-booster-plan.entity";

type BoosterPlanSelectionConfig = {
  name?: SellerBoosterTier;
  tier?: SellerBoosterTier;
  product_limit: number | null;
  is_unlimited: boolean;
};

@Injectable()
export class SellerBoosterService {
  constructor(
    @Inject("SellerBoosterPlanRepository")
    private readonly planRepository: typeof SellerBoosterPlan,
    @Inject("BoostedProductRepository")
    private readonly boostedProductRepository: typeof BoostedProduct,
    @Inject("BoosterPlanConfigRepository")
    private readonly boosterPlanConfigRepository: typeof BoosterPlanConfig,
    @Inject("ProductsRepository")
    private readonly productsRepository: typeof Products,
    @Inject("StoreRepository")
    private readonly storeRepository: typeof Store,
    @Inject("UserRepository")
    private readonly userRepository: typeof User,
    @Inject(forwardRef(() => PaystackService))
    private readonly paystackService: PaystackService,
  ) {}

  async getPlans(): Promise<DataResponseDto> {
    const configs = await this.boosterPlanConfigRepository.findAll({
      where: { is_active: true },
      order: [["id", "ASC"]],
    } as any);
    const plans = configs.map((plan) => ({
      id: plan.id,
      tier: plan.name,
      display_name: plan.display_name,
      product_limit: plan.is_unlimited ? null : plan.product_limit,
      duration: {
        days: plan.duration_days,
        label: `${plan.duration_days} days`,
      },
      amount: plan.price,
      price: plan.price,
      currency: plan.currency,
      description: plan.description,
      boost_score: plan.boost_score,
      is_unlimited: plan.is_unlimited,
    }));

    return new DataResponseDto(plans, true, "Booster plans retrieved");
  }

  async initializePayment(
    sellerId: number,
    storeId: number,
    dto: InitializeBoosterDto,
  ): Promise<DataResponseDto> {
    try {
      const { user, store } = await this.resolveSellerStore(sellerId, storeId);
      const config = await this.findActivePlanConfig(dto.tier);
      const tier = config.name;
      const durationDays = Number(config.duration_days);
      const selectedProductIds = await this.validateBoosterSelection(
        store.id,
        config,
        dto.product_ids || [],
      );
      const amount = Number(config.price);
      const reference = this.generateReference();

      await this.planRepository.update(
        { status: "cancelled" },
        {
          where: {
            store_id: store.id,
            seller_id: user._id,
            status: "pending",
          },
        },
      );

      const plan = await this.planRepository.create({
        store_id: store.id,
        seller_id: user._id,
        tier,
        status: "pending",
        product_limit: config.is_unlimited ? null : config.product_limit,
        boost_score: config.boost_score,
        duration_days: durationDays,
        price: config.price,
        currency: config.currency,
        is_unlimited: config.is_unlimited,
        booster_plan_config_id: config.id,
        starts_at: null,
        expires_at: null,
        paystack_reference: reference,
        amount,
        selected_product_ids: config.is_unlimited ? null : selectedProductIds,
      } as any);

      try {
        const paystack = await this.paystackService.initializePayment({
          email: user.email,
          amount,
          currency: "NGN",
          callback_url:
            dto.callback_url ||
            `${process.env.FRONTEND_URL || "http://localhost:3000"}/seller/booster/callback`,
          reference,
          metadata: {
            checkout_type: SELLER_BOOSTER_CHECKOUT_TYPE,
            booster_plan_id: plan.id,
            store_id: store.id,
            seller_id: user._id,
            tier,
            booster_plan_config_id: config.id,
            product_ids: selectedProductIds,
            duration_days: durationDays,
            boost_score: config.boost_score,
            product_limit: config.is_unlimited ? null : config.product_limit,
            is_unlimited: config.is_unlimited,
            price: config.price,
          },
        } as any);

        return new DataResponseDto(
          {
            booster_plan: this.serializePlan(plan),
            payment: paystack,
          },
          true,
          "Booster payment initialized",
        );
      } catch (error) {
        await plan.update({ status: "cancelled" });
        throw error;
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }

  async verifyAndActivate(
    sellerId: number,
    storeId: number,
    reference: string,
  ): Promise<DataResponseDto> {
    try {
      const payment = await this.paystackService.verifyPayment({ reference });
      const paymentData = payment?.data || payment;

      if (String(paymentData?.status || "").toLowerCase() !== "success") {
        throw new BadRequestException("Booster payment has not been completed");
      }

      const plan = await this.activateFromPaymentData(paymentData, {
        sellerId,
        storeId,
      });

      return new DataResponseDto(
        await this.getPlanDetails(plan.id),
        true,
        "Booster activated",
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }

  async activateFromWebhook(paymentData: any): Promise<boolean> {
    const metadata = paymentData?.metadata || {};

    if (metadata.checkout_type !== SELLER_BOOSTER_CHECKOUT_TYPE) {
      return false;
    }

    if (String(paymentData?.status || "").toLowerCase() !== "success") {
      await this.markPaymentFailed(paymentData?.reference);
      return true;
    }

    await this.activateFromPaymentData(paymentData);
    return true;
  }

  async markPaymentFailed(reference: string): Promise<void> {
    if (!reference) {
      return;
    }

    await this.planRepository.update(
      { status: "cancelled" },
      {
        where: {
          paystack_reference: reference,
          status: "pending",
        },
      },
    );
  }

  async getStatus(sellerId: number, storeId: number): Promise<DataResponseDto> {
    await this.expireExpiredBoosters(storeId);

    const activePlan = await this.findActivePlan(storeId, sellerId);
    if (!activePlan) {
      return new DataResponseDto(
        {
          active_plan: null,
          boosted_product_count: 0,
          boosted_products: [],
        },
        true,
        "No active booster plan",
      );
    }

    return new DataResponseDto(
      await this.getPlanDetails(activePlan.id),
      true,
      "Active booster status retrieved",
    );
  }

  async updateSelectedProducts(
    sellerId: number,
    storeId: number,
    dto: UpdateBoostedProductsDto,
  ): Promise<DataResponseDto> {
    try {
      await this.expireExpiredBoosters(storeId);

      const activePlan = await this.findActivePlan(storeId, sellerId);
      if (!activePlan) {
        throw new NotFoundException("No active booster plan found");
      }

      if (activePlan.is_unlimited) {
        throw new BadRequestException(
          "Unlimited boosters automatically cover all active products",
        );
      }

      const productIds = await this.validateBoosterSelection(
        storeId,
        activePlan,
        dto.product_ids,
      );

      await this.withTransaction(async (transaction) => {
        await this.replaceBoostedProductsForPlan(
          activePlan,
          productIds,
          activePlan.boost_score,
          transaction,
        );
        await activePlan.update(
          { selected_product_ids: productIds },
          { transaction },
        );
      });

      return new DataResponseDto(
        await this.getPlanDetails(activePlan.id),
        true,
        "Boosted products updated",
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }

  async cancel(sellerId: number, storeId: number): Promise<DataResponseDto> {
    try {
      await this.expireExpiredBoosters(storeId);

      const activePlan = await this.findActivePlan(storeId, sellerId);
      if (!activePlan) {
        throw new NotFoundException("No active booster plan found");
      }

      await this.withTransaction(async (transaction) => {
        await this.deactivatePlan(activePlan, "cancelled", transaction);
      });

      return new DataResponseDto(
        await this.getPlanDetails(activePlan.id),
        true,
        "Booster cancelled",
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleBoosterExpiryCron(): Promise<void> {
    await this.expireExpiredBoosters();
  }

  async expireExpiredBoosters(storeId?: number): Promise<number> {
    const now = new Date();
    const where: any = {
      status: "active",
      expires_at: {
        [Op.lte]: now,
      },
    };

    if (storeId) {
      where.store_id = storeId;
    }

    const plans = await this.planRepository.findAll({ where });

    if (plans.length === 0) {
      return 0;
    }

    await this.withTransaction(async (transaction) => {
      for (const plan of plans) {
        await this.deactivatePlan(plan, "expired", transaction);
      }
    });

    return plans.length;
  }

  private async activateFromPaymentData(
    paymentData: any,
    expected?: { sellerId?: number; storeId?: number },
  ): Promise<SellerBoosterPlan> {
    const reference = paymentData?.reference;
    const metadata = paymentData?.metadata || {};

    if (!reference) {
      throw new BadRequestException("Payment reference is required");
    }

    if (metadata.checkout_type !== SELLER_BOOSTER_CHECKOUT_TYPE) {
      throw new BadRequestException("Payment is not a seller booster checkout");
    }

    return this.withTransaction(async (transaction) => {
      const plan = await this.findPlanForActivation(
        reference,
        metadata.booster_plan_id,
        transaction,
      );

      if (!plan) {
        throw new NotFoundException("Pending booster plan not found");
      }

      if (
        expected?.sellerId &&
        Number(plan.seller_id) !== Number(expected.sellerId)
      ) {
        throw new ForbiddenException("You cannot activate another seller's plan");
      }

      if (expected?.storeId && Number(plan.store_id) !== Number(expected.storeId)) {
        throw new ForbiddenException("You cannot activate another store's plan");
      }

      if (plan.status === "active") {
        return plan;
      }

      if (plan.status !== "pending") {
        throw new BadRequestException(
          `Booster plan cannot be activated from ${plan.status} status`,
        );
      }

      if (Number(paymentData.amount || 0) < Number(plan.amount || 0)) {
        throw new BadRequestException("Booster payment amount is incomplete");
      }

      const productIds =
        plan.is_unlimited
          ? await this.getActiveStoreProductIds(plan.store_id, transaction)
          : await this.validateBoosterSelection(
              plan.store_id,
              plan,
              plan.selected_product_ids || metadata.product_ids || [],
              transaction,
            );

      if (productIds.length === 0) {
        throw new BadRequestException("No active products are available to boost");
      }

      await this.cancelActiveStorePlans(
        plan.store_id,
        plan.id,
        transaction,
      );

      const startsAt = new Date();
      const expiresAt = this.addDays(startsAt, Number(plan.duration_days || 30));

      await plan.update(
        {
          status: "active",
          starts_at: startsAt,
          expires_at: expiresAt,
          selected_product_ids: plan.is_unlimited ? null : productIds,
        },
        { transaction },
      );

      await this.createBoostedProducts(
        plan,
        productIds,
        startsAt,
        expiresAt,
        plan.boost_score,
        transaction,
      );

      return plan;
    });
  }

  private async resolveSellerStore(
    sellerId: number,
    storeId: number,
  ): Promise<{ user: User; store: Store }> {
    const [user, store] = await Promise.all([
      this.userRepository.findByPk(sellerId),
      this.storeRepository.findByPk(storeId),
    ]);

    if (!user) {
      throw new NotFoundException("Seller user not found");
    }

    if (!store) {
      throw new NotFoundException("Seller store not found");
    }

    if (Number(user.store_id) !== Number(store.id)) {
      throw new ForbiddenException("Seller does not own this store");
    }

    if (String(store.status || "").toLowerCase() !== "approved") {
      throw new BadRequestException("Store must be approved before boosting");
    }

    return { user, store };
  }

  private async validateBoosterSelection(
    storeId: number,
    config: BoosterPlanSelectionConfig,
    productIds: number[],
    transaction?: Transaction,
  ): Promise<number[]> {
    const tier = (config as BoosterPlanConfig).name || (config as SellerBoosterPlan).tier;

    if (config.is_unlimited) {
      const activeProductIds = await this.getActiveStoreProductIds(
        storeId,
        transaction,
      );
      if (activeProductIds.length === 0) {
        throw new BadRequestException(
          `${tier} requires at least one active product`,
        );
      }
      return activeProductIds;
    }

    const normalizedProductIds = this.normalizeProductIds(productIds);
    const limit = Number(config.product_limit || 0);

    if (!Number.isFinite(limit) || limit <= 0) {
      throw new BadRequestException(`${tier} booster product limit is invalid`);
    }

    if (normalizedProductIds.length === 0) {
      throw new BadRequestException(`${tier} boosters require product_ids`);
    }

    if (normalizedProductIds.length > limit) {
      throw new BadRequestException(
        `${tier} boosters can include at most ${limit} products`,
      );
    }

    const products = await this.productsRepository.findAll({
      where: {
        _id: { [Op.in]: normalizedProductIds },
        store_id: storeId,
        status: true,
        unit: { [Op.gt]: 0 },
      },
      transaction,
    } as any);

    if (products.length !== normalizedProductIds.length) {
      throw new BadRequestException(
        "Products must belong to your store and be active",
      );
    }

    return normalizedProductIds;
  }

  private async getActiveStoreProductIds(
    storeId: number,
    transaction?: Transaction,
  ): Promise<number[]> {
    const products = await this.productsRepository.findAll({
      attributes: ["_id"],
      where: {
        store_id: storeId,
        status: true,
        unit: { [Op.gt]: 0 },
      },
      transaction,
    } as any);

    return products.map((product) => Number(product._id)).filter(Boolean);
  }

  private async findPlanForActivation(
    reference: string,
    planId: number,
    transaction: Transaction,
  ): Promise<SellerBoosterPlan | null> {
    const where: any = { paystack_reference: reference };

    if (planId) {
      where.id = Number(planId);
    }

    return this.planRepository.findOne({
      where,
      transaction,
      lock: transaction.LOCK.UPDATE,
    } as any);
  }

  private async cancelActiveStorePlans(
    storeId: number,
    exceptPlanId: number,
    transaction: Transaction,
  ): Promise<void> {
    const activePlans = await this.planRepository.findAll({
      where: {
        store_id: storeId,
        status: "active",
        id: { [Op.ne]: exceptPlanId },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    } as any);

    for (const activePlan of activePlans) {
      await this.deactivatePlan(activePlan, "cancelled", transaction);
    }
  }

  private async replaceBoostedProductsForPlan(
    plan: SellerBoosterPlan,
    productIds: number[],
    boostScore: number,
    transaction: Transaction,
  ): Promise<void> {
    const existingRows = await this.boostedProductRepository.findAll({
      where: {
        booster_plan_id: plan.id,
        status: "active",
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    } as any);
    const oldProductIds = existingRows.map((row) => Number(row.product_id));

    await this.boostedProductRepository.update(
      { status: "cancelled" },
      {
        where: {
          booster_plan_id: plan.id,
          status: "active",
        },
        transaction,
      } as any,
    );

    await this.clearProductBoosts(oldProductIds, transaction);

    await this.createBoostedProducts(
      plan,
      productIds,
      plan.starts_at || new Date(),
      plan.expires_at,
      boostScore,
      transaction,
    );
  }

  private async createBoostedProducts(
    plan: SellerBoosterPlan,
    productIds: number[],
    startsAt: Date,
    expiresAt: Date,
    boostScore: number,
    transaction: Transaction,
  ): Promise<void> {
    await this.boostedProductRepository.bulkCreate(
      productIds.map((productId) => ({
        store_id: plan.store_id,
        seller_id: plan.seller_id,
        product_id: productId,
        booster_plan_id: plan.id,
        tier: plan.tier,
        boost_score: boostScore,
        starts_at: startsAt,
        expires_at: expiresAt,
        status: "active",
      })) as any,
      { transaction },
    );

    await this.productsRepository.update(
      {
        is_boosted: true,
        boost_score: boostScore,
        boosted_until: expiresAt,
      },
      {
        where: { _id: { [Op.in]: productIds } },
        transaction,
      } as any,
    );
  }

  private async deactivatePlan(
    plan: SellerBoosterPlan,
    status: Extract<SellerBoosterPlanStatus, "expired" | "cancelled">,
    transaction: Transaction,
  ): Promise<void> {
    const boostedRows = await this.boostedProductRepository.findAll({
      where: {
        booster_plan_id: plan.id,
        status: "active",
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    } as any);
    const productIds = boostedRows.map((row) => Number(row.product_id));
    const boostedStatus = status as BoostedProductStatus;

    await plan.update({ status }, { transaction });
    await this.boostedProductRepository.update(
      { status: boostedStatus },
      {
        where: {
          booster_plan_id: plan.id,
          status: "active",
        },
        transaction,
      } as any,
    );

    await this.clearProductBoosts(productIds, transaction);
  }

  private async clearProductBoosts(
    productIds: number[],
    transaction: Transaction,
  ): Promise<void> {
    const ids = this.normalizeProductIds(productIds);
    if (ids.length === 0) {
      return;
    }

    await this.productsRepository.update(
      {
        is_boosted: false,
        boost_score: 0,
        boosted_until: null,
      },
      {
        where: { _id: { [Op.in]: ids } },
        transaction,
      } as any,
    );
  }

  private async findActivePlan(
    storeId: number,
    sellerId: number,
  ): Promise<SellerBoosterPlan | null> {
    return this.planRepository.findOne({
      where: {
        store_id: storeId,
        seller_id: sellerId,
        status: "active",
        expires_at: { [Op.gt]: new Date() },
      },
      order: [["expires_at", "DESC"]],
    } as any);
  }

  private async getPlanDetails(planId: number): Promise<Record<string, any>> {
    const plan = await this.planRepository.findByPk(planId);
    if (!plan) {
      throw new NotFoundException("Booster plan not found");
    }

    const boostedRows = await this.boostedProductRepository.findAll({
      where: {
        booster_plan_id: plan.id,
      },
      order: [["created_at", "DESC"]],
    } as any);
    const activeRows = boostedRows.filter((row) => row.status === "active");
    const productIds = activeRows.map((row) => Number(row.product_id));
    const products = productIds.length
      ? await this.productsRepository.findAll({
          attributes: [
            "_id",
            "name",
            "image",
            "slug",
            "price",
            "retail_rate",
            "is_boosted",
            "boost_score",
            "boosted_until",
          ],
          where: { _id: { [Op.in]: productIds } },
        } as any)
      : [];
    const productMap = new Map(products.map((product) => [Number(product._id), product]));

    return {
      active_plan: this.serializePlan(plan),
      tier: plan.tier,
      expires_at: plan.expires_at,
      boosted_product_count: activeRows.length,
      boosted_products: activeRows.map((row) => ({
        id: row.id,
        product_id: row.product_id,
        tier: row.tier,
        boost_score: row.boost_score,
        starts_at: row.starts_at,
        expires_at: row.expires_at,
        status: row.status,
        product: productMap.get(Number(row.product_id)) || null,
      })),
    };
  }

  private serializePlan(plan: SellerBoosterPlan): Record<string, any> {
    return {
      id: plan.id,
      store_id: plan.store_id,
      seller_id: plan.seller_id,
      tier: plan.tier,
      status: plan.status,
      product_limit: plan.product_limit,
      boost_score: plan.boost_score,
      duration_days: plan.duration_days,
      price: plan.price ?? plan.amount,
      currency: plan.currency || "NGN",
      is_unlimited: plan.is_unlimited,
      booster_plan_config_id: plan.booster_plan_config_id,
      starts_at: plan.starts_at,
      expires_at: plan.expires_at,
      paystack_reference: plan.paystack_reference,
      amount: plan.amount,
      selected_product_ids: plan.selected_product_ids,
      created_at: (plan as any).created_at,
      updated_at: (plan as any).updated_at,
    };
  }

  private async findActivePlanConfig(
    tier: SellerBoosterTier,
  ): Promise<BoosterPlanConfig> {
    const normalizedTier = this.resolveTier(tier);
    const config = await this.boosterPlanConfigRepository.findOne({
      where: {
        name: normalizedTier,
        is_active: true,
      },
    } as any);

    if (!config) {
      throw new BadRequestException("Selected booster plan is not available");
    }

    if (!config.is_unlimited && !Number(config.product_limit || 0)) {
      throw new BadRequestException(
        "Selected booster plan has an invalid product limit",
      );
    }

    if (!Number(config.boost_score || 0)) {
      throw new BadRequestException(
        "Selected booster plan has an invalid boost score",
      );
    }

    if (!Number(config.duration_days || 0)) {
      throw new BadRequestException(
        "Selected booster plan has an invalid duration",
      );
    }

    if (!Number(config.price || 0)) {
      throw new BadRequestException("Selected booster plan has an invalid price");
    }

    return config;
  }

  private resolveTier(tier: SellerBoosterTier): SellerBoosterTier {
    if (!["basic", "gold", "premium"].includes(tier)) {
      throw new BadRequestException("Invalid booster tier");
    }

    return tier;
  }

  private normalizeProductIds(productIds: number[] = []): number[] {
    return [
      ...new Set(
        (productIds || [])
          .map((productId) => Number(productId))
          .filter((productId) => Number.isFinite(productId) && productId > 0),
      ),
    ];
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private generateReference(): string {
    return `seller_booster_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  private async withTransaction<T>(
    callback: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    const sequelize = this.planRepository.sequelize || Products.sequelize;

    if (!sequelize) {
      throw new InternalServerErrorException("Database connection unavailable");
    }

    return sequelize.transaction(callback);
  }
}
