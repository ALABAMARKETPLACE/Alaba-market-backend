import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
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

@Injectable()
export class PaymentSplitService {
  constructor(
    @InjectModel(PaymentSplit)
    private readonly paymentSplitRepository: typeof PaymentSplit,

    @InjectModel(Store)
    private readonly storeRepository: typeof Store,

    @InjectModel(Order)
    private readonly orderRepository: typeof Order,

    // 🔑 SINGLE PaystackService (from paystack_payment)
    private readonly paystackService: PaystackService
  ) {}



  // ===============================
// Seller: get own payment splits
// ===============================
async getStorePaymentSplits(
  storeId: number,
  page = 1,
  limit = 20
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
      count
    );
  } catch (err) {
    throw new InternalServerErrorException(getErrorMessage(err));
  }
}

// ===============================
// Admin: get all payment splits
// ===============================
async getAdminPaymentSplits(
    page = 1,
    limit = 50
  ): Promise<DataResponseDto> {
    try {
      const offset = (page - 1) * limit;

      const { rows, count } =
        await this.paymentSplitRepository.findAndCountAll({
          include: [
            {
              model: Store,
              attributes: ["id", "store_name"],
            },
            {
              model: Order,
              attributes: ["id", "order_id", "status", "total"],
            },
          ],
          order: [["createdAt", "DESC"]],
          limit,
          offset,
        });

      const totalAdminEarnings = rows.reduce(
        (sum, r) => sum + Number(r.admin_amount),
        0
      );

      const totalSellerPayouts = rows.reduce(
        (sum, r) => sum + Number(r.seller_amount),
        0
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
        count
      );
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  /**
   * Create payment split when order is placed
   */
  async createPaymentSplit(orderId: number, totalAmount: number) {
    try {
      return await this.paymentSplitRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const order = await this.orderRepository.findByPk(orderId, {
            include: [{ model: Store }],
            transaction,
          });

          if (!order) {
            throw new HttpException("Order not found", HttpStatus.NOT_FOUND);
          }

          const store = order.storeDetails;
          if (!store || store.subaccount_status !== "active") {
            throw new HttpException(
              "Store subaccount is not active",
              HttpStatus.BAD_REQUEST
            );
          }

          const product_total_kobo = Math.round(totalAmount * 100);
          const split = computeSplit({ product_total_kobo });

          return await this.paymentSplitRepository.create(
            {
              order_id: orderId,
              store_id: store.id,
              total_amount: product_total_kobo / 100,
              admin_amount: split.admin_amount_kobo / 100,
              seller_amount: split.seller_amount_kobo / 100,
              admin_percentage: split.admin_percentage,
              seller_percentage: split.seller_percentage,
              split_status: "pending",
            },
            { transaction }
          );
        }
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  /**
   * Initialize Paystack payment with split
   */
  async processPaymentWithSplit(orderId: number, paymentData: any) {
    try {
      return await this.paymentSplitRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const paymentSplit = await this.paymentSplitRepository.findOne({
            where: { order_id: orderId },
            include: [{ model: Store }, { model: Order }],
            transaction,
          });

          if (!paymentSplit) {
            throw new HttpException(
              "Payment split not found",
              HttpStatus.NOT_FOUND
            );
          }

          if (!paymentSplit.store?.paystack_subaccount_code) {
            throw new HttpException(
              "Store subaccount not configured",
              HttpStatus.BAD_REQUEST
            );
          }

          const initData = {
            email: paymentData.email,
            amount: Math.round(paymentSplit.total_amount * 100),
            reference: paymentData.reference,
            callback_url: paymentData.callback_url,
            subaccount: paymentSplit.store.paystack_subaccount_code,
            bearer: "account",
            metadata: {
              order_id: paymentSplit.order_id,
              store_id: paymentSplit.store_id,
              split_payment: true,
            },
          };

          //Uses paystack_payment service
          const paystackResponse =
          await this.paystackService.initializePayment(initData);

        const reference = paystackResponse.data.reference;

        await paymentSplit.update(
          {
            paystack_transaction_id: reference,
            paystack_split_response: paystackResponse.data as unknown as any,
            split_status: "pending",
          },
          { transaction }
        );

        return {
          paymentSplit,
          paystackResponse,
        };
        }
      );
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  /**
   * Verify payment (used by webhook or manual fallback)
   */
  async verifyPayment(reference: string) {
    try {
      //paystack_payment API
      const verification =
        await this.paystackService.verifyPaymentByReference(reference);

      const transactionData =
        verification?.data ?? verification;

      await this.updatePaymentSplitStatus(reference, transactionData);

      return new DataResponseDto(
        transactionData,
        true,
        "Payment verified successfully"
      );
    } catch (err) {
      throw new InternalServerErrorException(
        `Payment verification failed: ${err.message}`
      );
    }
  }

  /**
   * Update split status after verification
   */
  private async updatePaymentSplitStatus(reference: string, data: any) {
    const paymentSplit = await this.paymentSplitRepository.findOne({
      where: { paystack_transaction_id: reference },
    });

    if (!paymentSplit) return;

    const success = data.status === "success";

    await paymentSplit.update({
      split_status: success ? "completed" : "failed",
      admin_settled: success,
      seller_settled: success,
      admin_settled_at: success ? new Date() : null,
      seller_settled_at: success ? new Date() : null,
      paystack_split_response: data,
    });
  }
}
