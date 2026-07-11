import {
  Injectable,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Inject,
  forwardRef,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Transaction } from "sequelize";

import { PaymentSplit } from "./payment-split.entity";
import { Store } from "../STORE/store.entity";
import { Order } from "../ORDER/order.entity";

import computeSplit from "../shared/helpers/computeSplit";
import { PaystackService } from "../PAYSTACK_PAYMENT/paystack.service";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Role } from "../shared/enum/role.enum";
import { resolveStoreSubaccountCode } from "../shared/helpers/paystack-subaccount.helper";
import { PaystackAccountConfigService } from "../PAYSTACK_PAYMENT/paystack-account-config.service";

type PaymentSplitActor = {
  userId?: number;
  storeId?: number;
  role?: string;
};

@Injectable()
export class PaymentSplitService {
  private readonly logger = new Logger(PaymentSplitService.name);

  constructor(
    @InjectModel(PaymentSplit)
    private readonly paymentSplitRepository: typeof PaymentSplit,

    @InjectModel(Store)
    private readonly storeRepository: typeof Store,

    @InjectModel(Order)
    private readonly orderRepository: typeof Order,

    @Inject(forwardRef(() => PaystackService))
    private readonly paystackService: PaystackService,
    private readonly paystackAccountConfigService: PaystackAccountConfigService,
  ) {}

  private toKobo(amount: number | string | null | undefined): number {
    return Math.round(Number(amount || 0) * 100);
  }

  private toPlainJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private assertActorCanManageOrder(order: Order, actor?: PaymentSplitActor) {
    if (!actor?.role) {
      return;
    }

    const role = actor.role.toLowerCase();

    if (role === Role.Admin) {
      return;
    }

    if (role === Role.Seller) {
      if (!actor.storeId || Number(order.storeId) !== Number(actor.storeId)) {
        throw new ForbiddenException(
          "You do not have access to manage split payments for this order",
        );
      }
      return;
    }

    if (role === Role.User) {
      if (!actor.userId || Number(order.userId) !== Number(actor.userId)) {
        throw new ForbiddenException(
          "You do not have access to manage split payments for this order",
        );
      }
      return;
    }

    throw new ForbiddenException(
      "You do not have access to manage split payments for this order",
    );
  }

  private buildSplitAmounts(order: Order) {
    const totalAmountKobo =
      this.toKobo(order.total) +
      this.toKobo(order.deliveryCharge) +
      this.toKobo(order.tax) -
      this.toKobo(order.discount);
    const split = computeSplit({
      product_total_kobo: this.toKobo(order.total),
      delivery_kobo: this.toKobo(order.deliveryCharge),
      tax_kobo: this.toKobo(order.tax),
      discount_kobo: this.toKobo(order.discount),
      admin_percentage:
        this.paystackAccountConfigService.getAdminSplitPercentage(),
      seller_fee_surcharge_kobo:
        this.paystackAccountConfigService.getSellerFeeSurchargeKobo(
          totalAmountKobo,
        ),
    });

    return {
      total_amount: Number(
        (
          (split.admin_amount_kobo + split.seller_amount_kobo) /
          100
        ).toFixed(2),
      ),
      admin_amount: Number((split.admin_amount_kobo / 100).toFixed(2)),
      seller_amount: Number((split.seller_amount_kobo / 100).toFixed(2)),
      admin_percentage: split.admin_percentage,
      seller_percentage: split.seller_percentage,
    };
  }

  private async getOrderWithStore(
    orderId: number,
    transaction: Transaction,
  ): Promise<Order> {
    const order = await this.orderRepository.findByPk(orderId, {
      include: [{ model: Store }],
      transaction,
    });

    if (!order) {
      throw new HttpException("Order not found", HttpStatus.NOT_FOUND);
    }

    const store = order.storeDetails;
    if (
      !store ||
      store.subaccount_status !== "active" ||
      !resolveStoreSubaccountCode(store)
    ) {
      throw new HttpException(
        "Store subaccount is not active",
        HttpStatus.BAD_REQUEST,
      );
    }

    return order;
  }

  /* ============================================
     SELLER: own payment splits
  ============================================ */
  async getStorePaymentSplits(
    storeId: number,
    page = 1,
    limit = 20,
  ): Promise<DataResponseDto> {
    try {
      const offset = (page - 1) * limit;

      const { rows, count } =
        await this.paymentSplitRepository.findAndCountAll({
          where: { store_id: storeId },
          include: [
            {
              model: Order,
              attributes: ["id", "order_id", "status", "total"],
            },
          ],
          order: [["createdAt", "DESC"]],
          limit,
          offset,
        });

      const pageOptions = Object.assign(new PageOptionsDto(), {
        page,
        take: limit,
      });

      return new DataResponseDto(
        rows,
        true,
        "Payment splits fetched successfully",
        pageOptions,
        count,
      );
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  /* ============================================
     ADMIN: all payment splits
  ============================================ */
  async getAdminPaymentSplits(
    page = 1,
    limit = 50,
  ): Promise<DataResponseDto> {
    try {
      const offset = (page - 1) * limit;

      const { rows, count } =
        await this.paymentSplitRepository.findAndCountAll({
          include: [
            { model: Store, attributes: ["id", "store_name"] },
            { model: Order, attributes: ["id", "order_id", "status", "total"] },
          ],
          order: [["createdAt", "DESC"]],
          limit,
          offset,
        });

      const totalAdminEarnings = rows.reduce(
        (sum, r) => sum + Number(r.admin_amount),
        0,
      );

      const totalSellerPayouts = rows.reduce(
        (sum, r) => sum + Number(r.seller_amount),
        0,
      );

      const pageOptions = Object.assign(new PageOptionsDto(), {
        page,
        take: limit,
      });

      return new DataResponseDto(
        {
          splits: rows,
          summary: {
            total_admin_earnings: Number(totalAdminEarnings.toFixed(2)),
            total_seller_payouts: Number(totalSellerPayouts.toFixed(2)),
            total_transactions: count,
          },
        },
        true,
        "Admin payment splits fetched successfully",
        pageOptions,
        count,
      );
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  /* ============================================
     CREATE SPLIT (order creation)
  ============================================ */
  async createPaymentSplit(orderId: number, actor?: PaymentSplitActor) {
    try {
      const result = await this.paymentSplitRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const order = await this.getOrderWithStore(orderId, transaction);
          this.assertActorCanManageOrder(order, actor);

          const existingPaymentSplit =
            await this.paymentSplitRepository.findOne({
              where: { order_id: orderId },
              transaction,
            });

          const splitAmounts = this.buildSplitAmounts(order);

          if (existingPaymentSplit) {
            if (
              existingPaymentSplit.split_status === "completed" ||
              existingPaymentSplit.paystack_transaction_id
            ) {
              return existingPaymentSplit;
            }

            await existingPaymentSplit.update(
              {
                store_id: order.storeId,
                split_status: existingPaymentSplit.split_status || "pending",
                ...splitAmounts,
              },
              { transaction },
            );

            return existingPaymentSplit;
          }

          return await this.paymentSplitRepository.create(
            {
              order_id: orderId,
              store_id: order.storeId,
              split_status: "pending",
              ...splitAmounts,
            },
            { transaction },
          );
        },
      );
      this.logger.log(
        {
          event: "payment_split_created",
          orderId,
          storeId: result?.store_id,
          paymentStatus: result?.split_status,
          amount: result?.total_amount,
        },
        "payment split created or reused",
      );
      return result;
    } catch (err) {
      this.logger.error(
        { event: "payment_split_creation_failed", orderId, err },
        "payment split creation failed",
      );
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  /* ============================================
     INITIALIZE PAYSTACK SPLIT PAYMENT
  ============================================ */
  async processPaymentWithSplit(
    orderId: number,
    paymentData: any,
    actor?: PaymentSplitActor,
  ) {
    try {
      const result = await this.paymentSplitRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const order = await this.getOrderWithStore(orderId, transaction);
          this.assertActorCanManageOrder(order, actor);

          const existingPaymentSplit =
            await this.paymentSplitRepository.findOne({
              where: { order_id: orderId },
              include: [{ model: Store }, { model: Order }],
              transaction,
            });

          const paymentSplit =
            existingPaymentSplit ||
            (await this.createPaymentSplit(orderId));

          if (!paymentSplit) {
            throw new HttpException(
              "Payment split not found",
              HttpStatus.NOT_FOUND,
            );
          }

          if (paymentSplit.split_status === "completed") {
            throw new HttpException(
              "Payment has already been completed for this order",
              HttpStatus.BAD_REQUEST,
            );
          }

          if (
            paymentSplit.split_status === "pending" &&
            paymentSplit.paystack_transaction_id
          ) {
            throw new HttpException(
              "Payment has already been initialized for this order",
              HttpStatus.BAD_REQUEST,
            );
          }

          const store = paymentSplit.store || order.storeDetails;
          if (!resolveStoreSubaccountCode(store)) {
            throw new HttpException(
              "Store subaccount not configured",
              HttpStatus.BAD_REQUEST,
            );
          }

          const paystackData =
            await this.paystackService.initializeSplitTransaction({
              email: paymentData.email,
              amount: this.toKobo(paymentSplit.total_amount),
              admin_amount: this.toKobo(paymentSplit.admin_amount),
              callback_url: paymentData.callback_url,
              reference: paymentData.reference,
              store_id: paymentSplit.store_id,
              order_id: paymentSplit.order_id,
            });

          await paymentSplit.update(
            {
              paystack_transaction_id: paystackData.reference,
              paystack_split_response: this.toPlainJson(paystackData),
              split_status: "pending",
            },
            { transaction },
          );

          return {
            paymentSplit,
            paystack: paystackData,
          };
        },
      );
      this.logger.log(
        {
          event: "split_payment_initialized",
          gateway: "paystack",
          orderId,
          storeId: result?.paymentSplit?.store_id,
          paymentReference: result?.paystack?.reference,
          paymentStatus: result?.paymentSplit?.split_status,
          amount: result?.paymentSplit?.total_amount,
        },
        "split payment initialized",
      );
      return result;
    } catch (err) {
      this.logger.error(
        {
          event: "split_payment_initialization_failed",
          gateway: "paystack",
          orderId,
          paymentReference: paymentData?.reference,
          err,
        },
        "split payment initialization failed",
      );
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  /* ============================================
     VERIFY PAYMENT
  ============================================ */
  async verifyPayment(reference: string) {
    try {
      const verification =
        await this.paystackService.verifyPaymentByReference(reference);

      const transactionData = verification?.data ?? verification;

      await this.syncPaymentStatusFromWebhook(reference, transactionData);

      return new DataResponseDto(
        transactionData,
        true,
        "Payment verified successfully",
      );
    } catch (err) {
      this.logger.error(
        {
          event: "split_payment_verification_failed",
          gateway: "paystack",
          paymentReference: reference,
          err,
        },
        "split payment verification failed",
      );
      throw new InternalServerErrorException(
        `Payment verification failed: ${err.message}`,
      );
    }
  }

  /* ============================================
     UPDATE SPLIT STATUS
  ============================================ */
  private async updatePaymentSplitStatus(reference: string, data: any) {
    const paymentSplit = await this.paymentSplitRepository.findOne({
      where: { paystack_transaction_id: reference },
    });

    if (!paymentSplit) return;

    const success = data.status === "success";

    await paymentSplit.update({
      split_status: success ? "completed" : "failed",
      paystack_split_response: this.toPlainJson(data),
    });
    this.logger.log(
      {
        event: "split_payment_status_synced",
        gateway: "paystack",
        paymentReference: reference,
        orderId: paymentSplit.order_id,
        storeId: paymentSplit.store_id,
        paymentStatus: success ? "success" : "failed",
        amount: data?.amount,
      },
      "split payment status synchronized",
    );
  }

  async syncPaymentStatusFromWebhook(reference: string, data: any) {
    await this.updatePaymentSplitStatus(reference, data);
  }
}
