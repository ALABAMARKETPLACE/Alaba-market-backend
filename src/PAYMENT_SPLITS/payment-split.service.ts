import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  InternalServerErrorException,
} from "@nestjs/common";
import { PaymentSplit } from "./payment-split.entity";
import { Store } from "../STORE/store.entity";
import { Order } from "../ORDER/order.entity";
import computeSplit from "../shared/helpers/computeSplit";
import { PaystackService } from "../PAYSTACK_PAYMENT/paystack.service";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Transaction } from "sequelize";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { InjectModel } from "@nestjs/sequelize";

@Injectable()
export class PaymentSplitService {
  private readonly paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  private readonly paystackBaseUrl = "https://api.paystack.co";
  private readonly adminSubaccountCode = process.env.ADMIN_PAYSTACK_SUBACCOUNT; // Your main account

  constructor(
    // @Inject("PaymentSplitRepository")
    @InjectModel(PaymentSplit)
    private readonly paymentSplitRepository: typeof PaymentSplit,
    @InjectModel(Store)
    private readonly storeRepository: typeof Store,
    @InjectModel(Order)
    private readonly orderRepository: typeof Order,
    private readonly httpService: HttpService
    ,
    private readonly paystackService: PaystackService
  ) {}

  // Create payment split when order is placed
  async createPaymentSplit(orderId: number, totalAmount: number) {
    try {
      return await this.paymentSplitRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          // Get order and store details
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

          // Compute split using kobo-safe utility
          const product_total_kobo = Math.round(totalAmount * 100);
          const split = computeSplit({ product_total_kobo });

          // Create payment split record (store amounts in Naira as decimals)
          const paymentSplit = await this.paymentSplitRepository.create(
            {
              order_id: orderId,
              store_id: store.id,
              total_amount: Number((product_total_kobo / 100).toFixed(2)),
              admin_amount: Number((split.admin_amount_kobo / 100).toFixed(2)),
              seller_amount: Number((split.seller_amount_kobo / 100).toFixed(2)),
              admin_percentage: split.admin_percentage,
              seller_percentage: split.seller_percentage,
              split_status: "pending",
            },
            { transaction }
          );

          return paymentSplit;
        }
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Process payment with Paystack split
  async processPaymentWithSplit(orderId: number, paymentData: any) {
    try {
      return await this.paymentSplitRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          // Get existing payment split
          const paymentSplit = await this.paymentSplitRepository.findOne({
            where: { order_id: orderId },
            include: [
              { 
                model: Store,
                attributes: ['id', 'paystack_subaccount_code', 'store_name']
              },
              { 
                model: Order,
                attributes: ['id', 'order_id', 'total']
              }
            ],
            transaction,
          });

          if (!paymentSplit) {
            throw new HttpException(
              "Payment split not found",
              HttpStatus.NOT_FOUND
            );
          }

          if (!paymentSplit.store.paystack_subaccount_code) {
            throw new HttpException(
              "Store subaccount not configured",
              HttpStatus.BAD_REQUEST
            );
          }

          // Prepare split payment data
          const reference = paymentData.reference || this.generateReference();
          const amount_kobo = Math.round(paymentSplit.total_amount * 100);
          const splitPayload = {
            email: paymentData.email,
            amount: amount_kobo,
            reference,
            currency: "NGN",
            callback_url: paymentData.callback_url,
            subaccount: paymentSplit.store.paystack_subaccount_code,
            bearer: "account",
            metadata: {
              order_id: paymentSplit.order_id,
              store_id: paymentSplit.store_id,
              split: {
                admin_amount_kobo: Math.round(paymentSplit.admin_amount * 100),
                seller_amount_kobo: Math.round(paymentSplit.seller_amount * 100),
                admin_percentage: paymentSplit.admin_percentage,
                seller_percentage: paymentSplit.seller_percentage,
              },
            },
          };

          // Initialize transaction via existing PaystackService (returns DataResponseDto)
          const initData = Object.assign({}, splitPayload, {
            amount: splitPayload.amount,
            split_payment: true,
            store_id: paymentSplit.store_id,
            order_id: paymentSplit.order_id,
          });

          const paystackResponse = await this.paystackService.initializePayment(
            initData as any
          );

          // paystackResponse.data may be either the Paystack wrapper or the inner data.
          const apiResp = paystackResponse.data as any;
          const paystackRef = apiResp?.data?.reference ?? apiResp?.reference;

          await paymentSplit.update(
            {
              paystack_transaction_id: paystackRef,
              paystack_split_response: apiResp as any,
              split_status: apiResp?.status ? "pending" : "failed",
            },
            { transaction }
          );

          return {
            paymentSplit,
            paystackResponse: paystackResponse.data,
          };
        }
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Prepare split payment data for Paystack API
  private prepareSplitPayment(paymentSplit: PaymentSplit, paymentData: any) {
    return {
      email: paymentData.email,
      amount: Math.round(paymentSplit.total_amount * 100), // Paystack expects kobo/cents
      reference: paymentData.reference || this.generateReference(),
      subaccount: paymentSplit.store.paystack_subaccount_code,
      transaction_charge: Math.round(paymentSplit.admin_amount * 100), // Admin's cut in kobo
      bearer: "account",
      callback_url: paymentData.callback_url,
      metadata: {
        order_id: paymentSplit.order_id,
        store_id: paymentSplit.store_id,
        admin_amount: paymentSplit.admin_amount,
        seller_amount: paymentSplit.seller_amount,
        split_type: "automatic",
      },
    };
      }

  // Generate unique payment reference
  private generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `alaba_${timestamp}_${random}`;
  }

  // Process split payment through Paystack API
  private async processPaystackSplitPayment(splitData: any) {
    // Deprecated in favour of PaystackService wrapper
    return this.paystackService.initializePayment(splitData as any);
  }

  // Verify split payment
  async verifyPayment(reference: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.paystackBaseUrl}/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${this.paystackSecretKey}`,
            },
          }
        )
      );

      if (!response.data.status) {
        throw new Error(`Paystack verification failed: ${response.data.message}`);
      }

      const transactionData = response.data.data;

      // Update payment split status
      await this.updatePaymentSplitStatus(reference, transactionData);

      return new DataResponseDto(
        transactionData,
        true,
        "Payment verified successfully"
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Payment verification failed: ${error.message}`
      );
    }
  }

  // Update payment split status after verification
  private async updatePaymentSplitStatus(reference: string, transactionData: any) {
    const paymentSplit = await this.paymentSplitRepository.findOne({
      where: { paystack_transaction_id: reference },
    });

    if (paymentSplit) {
      const isSuccess = transactionData.status === "success";
      
      await paymentSplit.update({
        split_status: isSuccess ? "completed" : "failed",
        admin_settled: isSuccess,
        seller_settled: isSuccess,
        admin_settled_at: isSuccess ? new Date() : null,
        seller_settled_at: isSuccess ? new Date() : null,
        paystack_split_response: transactionData as any,
      });
    }
  }

  // Get payment splits for a store
  async getStorePaymentSplits(storeId: number, page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { rows: splits, count } = await this.paymentSplitRepository.findAndCountAll({
        where: { store_id: storeId },
        include: [{ model: Order, attributes: ['id', 'order_id', 'status'] }],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      // Create proper PageOptionsDto instance
      const pageOptions = Object.assign(new PageOptionsDto(), { page, take: limit });

      return new DataResponseDto(
        splits,
        true,
        "Payment splits fetched successfully",
        pageOptions,
        count
      );
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Get admin payment splits summary
  async getAdminPaymentSplits(page: number = 1, limit: number = 50) {
    try {
      const offset = (page - 1) * limit;
      
      const { rows: splits, count } = await this.paymentSplitRepository.findAndCountAll({
        include: [
          { model: Store, attributes: ['id', 'store_name'] },
          { model: Order, attributes: ['id', 'order_id', 'status'] }
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      // Calculate totals
      const totalAdminEarnings = splits.reduce((sum, split) => sum + parseFloat(split.admin_amount.toString()), 0);
      const totalSellerPayouts = splits.reduce((sum, split) => sum + parseFloat(split.seller_amount.toString()), 0);

      // Create proper PageOptionsDto instance
      const pageOptions = Object.assign(new PageOptionsDto(), { page, take: limit });

      return new DataResponseDto(
        {
          splits,
          summary: {
            total_admin_earnings: Math.round(totalAdminEarnings * 100) / 100,
            total_seller_payouts: Math.round(totalSellerPayouts * 100) / 100,
            total_transactions: count,
          }
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
}