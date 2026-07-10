import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { Order } from "../ORDER/order.entity";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { User } from "../USERS/user.entity";
import { Store } from "../STORE/store.entity";
import { GuestCheckout } from "./guest-checkout.entity";
import { UserCheckout } from "./user-checkout.entity";

@Injectable()
export class PaystackReconciliationService {
  private readonly logger = new Logger(PaystackReconciliationService.name);

  private normalizeId(value: unknown): string | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    return String(value);
  }

  constructor(
    @InjectModel(Order)
    private readonly orderRepository: typeof Order,
    @InjectModel(OrderPayments)
    private readonly orderPaymentsRepository: typeof OrderPayments,
    @InjectModel(User)
    private readonly userRepository: typeof User,
    @InjectModel(Store)
    private readonly storeRepository: typeof Store,
    @InjectModel(GuestCheckout)
    private readonly guestCheckoutRepository: typeof GuestCheckout,
    @InjectModel(UserCheckout)
    private readonly userCheckoutRepository: typeof UserCheckout,
  ) {}

  /**
   * Find all Paystack payment references that don't have corresponding orders
   * These are orphaned payments that succeeded but orders weren't created
   */
  async findOrphanedPaystackPayments() {
    this.logger.log(
      { event: "reconciliation_scan_started", gateway: "paystack" },
      "scanning for orphaned Paystack payments",
    );

    try {
      // Get all ORDER_PAYMENTS with pay-online success status
      const successfulOnlinePayments =
        await this.orderPaymentsRepository.findAll({
          where: {
            paymentType: "pay-online",
            status: "success",
          },
          attributes: ["id", "orderId", "ref", "amount", "createdAt"],
          raw: true,
        });

      this.logger.log(
        {
          event: "reconciliation_payments_loaded",
          gateway: "paystack",
          paymentCount: successfulOnlinePayments.length,
        },
        "successful online payments loaded",
      );

      // Get all orders
      const orders = await this.orderRepository.findAll({
        attributes: ["id"],
        raw: true,
      });
      const orderIdSet = new Set(
        orders
          .map((o) => this.normalizeId(o.id))
          .filter((id): id is string => Boolean(id)),
      );

      // Find orphaned payments - successful but orderId is null or doesn't exist
      const orphanedPayments = successfulOnlinePayments.filter((p) => {
        const normalizedOrderId = this.normalizeId(p.orderId);
        return !normalizedOrderId || !orderIdSet.has(normalizedOrderId);
      });

      this.logger.log(
        {
          event: "reconciliation_orphaned_payments_found",
          gateway: "paystack",
          orphanedCount: orphanedPayments.length,
        },
        "orphaned successful payments found",
      );

      return {
        totalSuccessfulOnlinePayments: successfulOnlinePayments.length,
        orphanedCount: orphanedPayments.length,
        orphanedPayments: orphanedPayments.map((p) => ({
          paymentId: p.id,
          reference: p.ref,
          orderId: p.orderId || "NULL",
          amount: p.amount,
          timestamp: p.createdAt,
        })),
      };
    } catch (error) {
      this.logger.error(
        {
          event: "reconciliation_scan_failed",
          gateway: "paystack",
          err: error,
        },
        "Paystack reconciliation scan failed",
      );
      throw error;
    }
  }

  /**
   * Check for guest orders that reference Paystack payments
   */
  async findOrphanedGuestCheckout() {
    this.logger.log(
      { event: "guest_checkout_reconciliation_scan_started" },
      "scanning for orphaned guest checkouts",
    );

    try {
      // Get all guest checkouts with success payment status but not moved to orders
      const unprocessedCheckouts = await this.guestCheckoutRepository.findAll({
        where: {
          payment_status: "success",
          status: { [Op.ne]: "completed" },
        },
        attributes: ["id", "reference", "guest_email", "status", "order_ids"],
        raw: true,
      });

      this.logger.log(
        {
          event: "orphaned_guest_checkouts_found",
          checkoutCount: unprocessedCheckouts.length,
        },
        "successful guest checkouts awaiting finalization found",
      );

      return {
        unprocessedCheckoutCount: unprocessedCheckouts.length,
        unprocessedCheckouts: unprocessedCheckouts.map((c) => ({
          checkoutId: c.id,
          reference: c.reference,
          email: c.guest_email,
          status: c.status,
          orderIds: c.order_ids,
        })),
      };
    } catch (error) {
      this.logger.error(
        { event: "guest_checkout_reconciliation_scan_failed", err: error },
        "guest checkout reconciliation scan failed",
      );
      throw error;
    }
  }

  /**
   * Generate a detailed reconciliation report
   */
  async generateReconciliationReport(page = 1, take = 50) {
    this.logger.log(
      { event: "reconciliation_report_started", gateway: "paystack" },
      "generating reconciliation report",
    );

    try {
      const sanitizedPage = Math.max(1, Number(page) || 1);
      const sanitizedTake = Math.min(200, Math.max(1, Number(take) || 50));
      const offset = (sanitizedPage - 1) * sanitizedTake;

      const orphanedResults = await this.findOrphanedPaystackPayments();
      const orphanedGuest = await this.findOrphanedGuestCheckout();

      // Count orders with payment references
      const ordersWithPaymentRef = await this.orderRepository.count({
        where: { payment_reference: { [Op.ne]: null } },
      });

      // Count orders without payment reference
      const cashOrders = await this.orderRepository.count({
        where: {
          paymentType: "cash-on-delivery",
          payment_reference: null,
        },
      });

      const paystackOrderWhere = {
        paymentType: "pay-online",
        payment_reference: { [Op.ne]: null },
      };

      const totalDetailedOrdersAcrossAllPages =
        await this.orderRepository.count({
          where: paystackOrderWhere,
        });

      const paystackOrders = await this.orderRepository.findAll({
        where: paystackOrderWhere,
        attributes: [
          "id",
          "order_id",
          "userId",
          "storeId",
          "is_guest_order",
          "guest_email",
          "guest_first_name",
          "guest_last_name",
          "guest_phone",
          "payment_reference",
          "transaction_reference",
          "status",
          "total",
          "grandTotal",
          "createdAt",
        ],
        order: [["createdAt", "DESC"]],
        limit: sanitizedTake,
        offset,
        raw: true,
      });

      const userIds = Array.from(
        new Set(
          paystackOrders
            .map((o) => this.normalizeId(o.userId))
            .filter((id): id is string => Boolean(id)),
        ),
      );
      const storeIds = Array.from(
        new Set(
          paystackOrders
            .map((o) => this.normalizeId(o.storeId))
            .filter((id): id is string => Boolean(id)),
        ),
      );
      const orderIds = paystackOrders.map((o) => o.id);

      const [users, stores, orderPayments] = await Promise.all([
        this.userRepository.findAll({
          where: userIds.length
            ? { _id: { [Op.in]: userIds.map((id) => Number(id)) } }
            : undefined,
          attributes: [
            "_id",
            "first_name",
            "last_name",
            "name",
            "email",
            "phone",
            "active_role",
          ],
          raw: true,
        }),
        this.storeRepository.findAll({
          where: storeIds.length
            ? { id: { [Op.in]: storeIds.map((id) => Number(id)) } }
            : undefined,
          attributes: [
            "id",
            "store_name",
            "name",
            "business_name",
            "seller_name",
            "email",
            "phone",
            "slug",
            "status",
          ],
          raw: true,
        }),
        this.orderPaymentsRepository.findAll({
          where: orderIds.length
            ? {
                orderId: { [Op.in]: orderIds },
              }
            : undefined,
          attributes: ["orderId", "status", "ref", "amount", "createdAt"],
          raw: true,
        }),
      ]);

      const userMap = new Map(
        users.map((u) => [this.normalizeId(u._id), u] as const),
      );
      const storeMap = new Map(
        stores.map((s) => [this.normalizeId(s.id), s] as const),
      );
      const orderPaymentMap = new Map(
        orderPayments.map((p) => [this.normalizeId(p.orderId), p] as const),
      );

      const sellerBreakdown = new Map<
        string,
        {
          sellerId: number;
          storeName: string;
          sellerEmail: string;
          totalOrders: number;
          totalValue: number;
        }
      >();

      const paymentStatusBreakdown = new Map<string, number>();

      const enrichedOrders = paystackOrders.map((order) => {
        const normalizedUserId = this.normalizeId(order.userId);
        const normalizedStoreId = this.normalizeId(order.storeId);
        const normalizedOrderId = this.normalizeId(order.id);

        const buyer = normalizedUserId ? userMap.get(normalizedUserId) : null;
        const seller = normalizedStoreId
          ? storeMap.get(normalizedStoreId)
          : null;
        const payment = normalizedOrderId
          ? orderPaymentMap.get(normalizedOrderId)
          : null;

        const sellerKey = this.normalizeId(seller?.id);
        if (sellerKey) {
          const existing = sellerBreakdown.get(sellerKey) || {
            sellerId: seller.id,
            storeName: seller.store_name || seller.business_name || seller.name,
            sellerEmail: seller.email,
            totalOrders: 0,
            totalValue: 0,
          };
          existing.totalOrders += 1;
          existing.totalValue += Number(order.total || 0);
          sellerBreakdown.set(sellerKey, existing);
        }

        const paymentStatus = payment?.status || "missing";
        paymentStatusBreakdown.set(
          paymentStatus,
          (paymentStatusBreakdown.get(paymentStatus) || 0) + 1,
        );

        return {
          orderId: order.id,
          orderPublicId: order.order_id,
          sourceUserId: order.userId || null,
          sourceStoreId: order.storeId || null,
          createdAt: order.createdAt,
          status: order.status,
          amount: Number(order.total || 0),
          grandTotal: Number(order.grandTotal || 0),
          paymentReference: order.payment_reference,
          transactionReference: order.transaction_reference,
          payment: {
            status: payment?.status || null,
            ref: payment?.ref || null,
            amount: payment?.amount || null,
            recordedAt: payment?.createdAt || null,
          },
          buyer: order.is_guest_order
            ? {
                type: "guest",
                firstName: order.guest_first_name || null,
                lastName: order.guest_last_name || null,
                email: order.guest_email || null,
                phone: order.guest_phone || null,
              }
            : {
                type: "registered",
                id: buyer?._id || null,
                name:
                  buyer?.name ||
                  `${buyer?.first_name || ""} ${
                    buyer?.last_name || ""
                  }`.trim() ||
                  null,
                email: buyer?.email || null,
                phone: buyer?.phone || null,
                activeRole: buyer?.active_role || null,
              },
          seller: {
            id: seller?.id || null,
            storeName:
              seller?.store_name ||
              seller?.business_name ||
              seller?.name ||
              null,
            sellerName: seller?.seller_name || null,
            email: seller?.email || null,
            phone: seller?.phone || null,
            slug: seller?.slug || null,
            status: seller?.status || null,
          },
        };
      });

      return {
        summary: {
          totalOrdersWithPaymentRef: ordersWithPaymentRef,
          totalCashOnDeliveryOrders: cashOrders,
          orphanedPaystackPayments: orphanedResults.orphanedCount,
          unprocessedGuestCheckouts: orphanedGuest.unprocessedCheckoutCount,
          totalDetailedOrders: enrichedOrders.length,
          totalDetailedOrdersAcrossAllPages,
        },
        details: {
          paystackReconciliation: orphanedResults,
          guestCheckoutReconciliation: orphanedGuest,
          orderDetails: {
            pagination: {
              page: sanitizedPage,
              take: sanitizedTake,
              total: totalDetailedOrdersAcrossAllPages,
              hasNextPage:
                offset + enrichedOrders.length <
                totalDetailedOrdersAcrossAllPages,
            },
            paymentStatusBreakdown: Object.fromEntries(paymentStatusBreakdown),
            sellerBreakdown: Array.from(sellerBreakdown.values()).sort(
              (a, b) => b.totalOrders - a.totalOrders,
            ),
            recentOrders: enrichedOrders,
          },
        },
        recommendation:
          "Review orphaned payments and guest checkouts to determine if orders need to be manually created or if payments need to be refunded.",
      };
    } catch (error) {
      this.logger.error(
        {
          event: "reconciliation_report_failed",
          gateway: "paystack",
          err: error,
        },
        "reconciliation report generation failed",
      );
      throw error;
    }
  }

  /**
   * Get sample of mismatch between ORDER table and ORDER_PAYMENTS
   */
  async auditOrderPaymentMismatches() {
    this.logger.log(
      { event: "order_payment_audit_started" },
      "auditing order and payment mismatches",
    );

    try {
      // Orders with payment_reference but no corresponding ORDER_PAYMENTS record
      const orphanedOrderRefs = await this.orderRepository.findAll({
        attributes: ["id", "order_id", "payment_reference", "paymentType"],
        raw: true,
      });

      const allOrderPayments = await this.orderPaymentsRepository.findAll({
        attributes: ["orderId", "ref"],
        raw: true,
      });

      const paymentOrderIdSet = new Set(
        allOrderPayments
          .map((p) => this.normalizeId(p.orderId))
          .filter((id): id is string => Boolean(id)),
      );
      const paymentRefSet = new Set(
        allOrderPayments.map((p) => p.ref).filter(Boolean),
      );

      // Orders without payment payment records
      const ordersWithoutPaymentRecords = orphanedOrderRefs.filter(
        (o) => !paymentOrderIdSet.has(this.normalizeId(o.id) || ""),
      );

      // Orders with references that don't exist in payment records
      const ordersWithMissingRefs = orphanedOrderRefs.filter(
        (o) =>
          o.payment_reference &&
          !paymentRefSet.has(o.payment_reference) &&
          o.paymentType === "pay-online",
      );

      return {
        ordersWithoutPaymentRecords: ordersWithoutPaymentRecords.slice(0, 20),
        ordersWithMissingPaymentRefs: ordersWithMissingRefs.slice(0, 20),
        summary: {
          missingPaymentRecordsCount: ordersWithoutPaymentRecords.length,
          missingPaymentRefsCount: ordersWithMissingRefs.length,
        },
      };
    } catch (error) {
      this.logger.error(
        { event: "order_payment_audit_failed", err: error },
        "order and payment mismatch audit failed",
      );
      throw error;
    }
  }
}
