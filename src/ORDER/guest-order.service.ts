import { createStructuredLogger } from "../shared/logger/structured-logger";
// order/guest-order.service.ts

import {
  BadRequestException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { JwtService } from "@nestjs/jwt";
import { Op, Transaction, WhereOptions, literal } from "sequelize";

import { CreateGuestOrderDto } from "./dto/create-guest-order.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Order } from "./order.entity";
import { OrderItems } from "../ORDER_ITEMS/order_items.entity";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { Products } from "../PRODUCTS/products.entity";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { Store } from "../STORE/store.entity";
import { NotificationsService } from "../NOTIFICATIONS/notification.service";
import { MailService } from "../MAILS/Mails.services";
import { PaystackService } from "../PAYSTACK_PAYMENT/paystack.service";
import { ToUserOrderPlaced } from "../MAILS/templates/orders/toUser_OrderPlaced";
import { ToSellerOrderPlaced } from "../MAILS/templates/orders/toSeller_OrderPlaced";
import { OrderUpdateMail } from "../MAILS/templates/orders/order_Status_update";
import { GetGuestOrdersDto } from "./dto/get-guest-orders.dto";
import { PageOptionsGetOrdersDto } from "./dto/getOrders.dto";
import { GuestCheckout } from "../PAYSTACK_PAYMENT/guest-checkout.entity";
import { UpdateOrderStatus } from "./dto/updateOrderStatus.dto";
import { Role } from "../shared/enum/role.enum";
import { BudPayService } from "../BUDPAY_PAYMENT/budpay.service";
import { PalmPayService } from "../PALMPAY_PAYMENT/palmpay.service";

const appLog = createStructuredLogger("guest_order_service");

type GuestOrderCreationOptions = {
  skipPaymentVerification?: boolean;
  verifiedPaymentData?: any;
  skipDeliveryTokenVerification?: boolean;
  verifiedDeliveryData?: any;
};

@Injectable()
export class GuestOrderService {
  constructor(
    @InjectModel(Order)
    private readonly orderRepository: typeof Order,
    @InjectModel(GuestCheckout)
    private readonly guestCheckoutRepository: typeof GuestCheckout,
    @Inject(forwardRef(() => PaystackService))
    private readonly paystackService: PaystackService,
    @Inject(forwardRef(() => BudPayService))
    private readonly budPayService: BudPayService,
    @Inject(forwardRef(() => PalmPayService))
    private readonly palmPayService: PalmPayService,
    private readonly notificationService: NotificationsService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  private normalizeOrderQuantity(
    item: { quantity?: unknown },
    productId: number
  ): number {
    const quantity = Number(item?.quantity);

    if (
      Number.isNaN(quantity) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new BadRequestException(
        `Invalid quantity for product ${productId} in order request`
      );
    }

    return quantity;
  }

  private async loadStockProduct(productId: number, transaction: Transaction) {
    const product = await Products.findOne({
      where: { _id: productId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    return product;
  }

  private async loadStockVariant(variantId: number, transaction: Transaction) {
    const variant = await ProductVariant.findOne({
      where: { id: variantId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} not found`);
    }

    return variant;
  }

  /**
   * Recomputes the true cart subtotal (Naira) from product/variant records in
   * the database. Never trusts client-supplied unit_price/total_price — those
   * are only ever used for display. Called both before charging (Paystack
   * guest initialize) and again as the payment-amount gate before an order is
   * created, so a tampered client payload can't buy real goods for less than
   * their real price.
   */
  async calculateGuestCartSubtotalNaira(
    cartItems: Array<{
      product_id?: number;
      productId?: number;
      variant_id?: number | null;
      variantId?: number | null;
      quantity: number;
    }>,
  ): Promise<number> {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new BadRequestException("No products selected");
    }

    let subtotal = 0;

    for (const item of cartItems) {
      const productId = Number(item.product_id ?? item.productId);
      const variantId = item.variant_id ?? item.variantId ?? null;
      const quantity = this.normalizeOrderQuantity(item, productId);

      if (!Number.isFinite(productId) || productId <= 0) {
        throw new BadRequestException("Invalid product in cart");
      }

      const product = await Products.findOne({ where: { _id: productId } });
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }
      if (product.status === false) {
        throw new ServiceUnavailableException(
          `Product "${product.name}" is not available`,
        );
      }

      let unitPrice = Number(product.retail_rate || 0);

      if (variantId) {
        const variant = await ProductVariant.findOne({
          where: { id: Number(variantId) },
        });
        if (!variant) {
          throw new NotFoundException(`Variant ${variantId} not found`);
        }
        if (Number(variant.productId) !== productId) {
          throw new ServiceUnavailableException(
            "Variant does not belong to the selected product",
          );
        }
        unitPrice = Number(variant.price || 0);
      }

      subtotal += unitPrice * quantity;
    }

    return subtotal;
  }

  private getOrphanedGuestCheckoutDisplayStatus(checkout: any): string {
    const checkoutStatus = String(checkout?.status || "").toLowerCase();
    const paymentStatus = String(checkout?.payment_status || "").toLowerCase();

    if (paymentStatus === "success" && checkoutStatus !== "completed") {
      return "payment_received_processing";
    }

    if (paymentStatus === "pending") {
      return "payment_pending";
    }

    return checkout?.status || "pending";
  }

  private getOrphanedGuestCheckoutStatusRemark(checkout: any): string | null {
    const checkoutStatus = String(checkout?.status || "").toLowerCase();
    const paymentStatus = String(checkout?.payment_status || "").toLowerCase();

    if (paymentStatus === "success" && checkoutStatus !== "completed") {
      return "Payment was successful and is awaiting backend order finalization.";
    }

    return checkout?.error || null;
  }

  // ==================== MAIN ORDER CREATION ====================

  async createGuestOrder(
    data: CreateGuestOrderDto,
    options: GuestOrderCreationOptions = {},
  ) {
    try {
      appLog.info(
        {
          event: "guest_order_creation_started",
          paymentReference: data.payment.payment_reference,
          itemCount: data.cart_items.length,
          gateway: data.payment.payment_reference?.startsWith("budpay_")
            ? "budpay"
            : data.payment.payment_reference?.startsWith("PP")
            ? "palmpay"
            : "paystack",
        },
        "guest order creation started",
      );

      const existingOrders = await this.orderRepository.findAll({
        where: { payment_reference: data.payment.payment_reference },
        order: [["createdAt", "ASC"]],
      });

      if (existingOrders.length > 0) {
        return new DataResponseDto(
          this.formatOrderSummary(existingOrders),
          true,
          "Guest order already exists for this payment reference",
        );
      }

      // Detect multi-seller
      const storeIds = new Set(data.cart_items.map((item) => item.store_id));
      const isMultiSeller = storeIds.size > 1;

      appLog.info(
        {
          event: "guest_order_grouping",
          paymentReference: data.payment.payment_reference,
          storeCount: storeIds.size,
          isMultiSeller,
        },
        "guest order stores resolved",
      );

      const result = await this.orderRepository.sequelize!.transaction(
        async (t) => {
          const newOrders: any[] = [];

          // ✅ Step 1: Validate delivery token and basic data
          const verified = await this.basicCheck(data, options);

          // ✅ Step 2: Verify payment with Paystack (CRITICAL)
          if (data.payment.payment_reference) {
            const expectedAmountInKobo =
              await this.getExpectedGuestPaymentAmountInKobo(data, verified);

            if (options.skipPaymentVerification) {
              this.assertVerifiedPaymentData(
                options.verifiedPaymentData,
                data.payment.payment_reference,
                expectedAmountInKobo,
                data.guest_info.email,
              );
            } else {
              await this.verifyPaymentReference(
                data.payment.payment_reference,
                expectedAmountInKobo,
                data.guest_info.email,
              );
            }
          } else {
            throw new BadRequestException(
              "Payment reference is required. Please complete payment first.",
            );
          }

          // ✅ Step 3: Group products by store
          const productsByStore = await this.groupProducts(data.cart_items, t);

          // ✅ Step 4: Create order for each store
          for (const storeGroup of productsByStore) {
            // Create order
            const order = await this.placeGuestOrder(
              data,
              storeGroup,
              verified,
              t,
              isMultiSeller,
              data.payment.payment_reference,
            );

            // Create order items & update stock
            const [totalQuantity, totalAmount, orderItems] =
              await this.createItems(order.id, storeGroup, t);

            // Get store details
            const store = await Store.findOne({
              where: { id: storeGroup.storeId },
              transaction: t,
            });

            if (!store) {
              throw new NotFoundException(
                `Store ${storeGroup.storeId} not found`,
              );
            }

            // Calculate delivery date
            const deliveryDate = new Date();
            deliveryDate.setDate(
              deliveryDate.getDate() + (store?.delivery_period ?? 2),
            );
            deliveryDate.setMinutes(
              deliveryDate.getMinutes() + (store?.delivery_period_minutes ?? 0),
            );

            // Update order with totals
            order.delivery_date = deliveryDate;
            order.totalItems = totalQuantity;
            order.total = totalAmount;
            order.grandTotal = totalAmount - order.discount + order.tax;
            await order.save({ transaction: t });

            // Create payment record
            const payment = await this.createGuestOrderPayment(
              order.id,
              order.grandTotal,
              data.payment,
              t,
            );

            // Create order status
            const orderStatus = await this.createOrderStatus(
              order.id,
              order.status,
              t,
            );

            // Build address object for emails
            const guestAddressObject = {
              full_name: data.delivery_address.full_name,
              phone: data.delivery_address.phone_no,
              country_code: data.delivery_address.country_code,
              full_address: data.delivery_address.full_address,
              city: data.delivery_address.city,
              state: data.delivery_address.state,
              state_id: data.delivery_address.state_id,
              country: data.delivery_address.country,
              country_id: data.delivery_address.country_id,
              landmark: data.delivery_address.landmark,
              address_type: data.delivery_address.address_type,
            };

            // Collect order data
            newOrders.push({
              newOrder: order,
              orderPayment: payment,
              orderStatus: orderStatus,
              orderItems: orderItems,
              address: guestAddressObject,
              store: store,
            });
          }

          return newOrders;
        },
      );

      for (const createdOrder of result) {
        await this.afterCommit(
          data,
          createdOrder.newOrder,
          createdOrder.store,
          createdOrder.orderItems,
          createdOrder.address,
        );
      }

      appLog.info(
        {
          event: "guest_order_creation_succeeded",
          paymentReference: data.payment.payment_reference,
          orderIds: result.map((entry) => entry.newOrder?.id).filter(Boolean),
          orderCount: result.length,
          storeCount: storeIds.size,
        },
        "guest order creation succeeded",
      );

      // Format response
      const formattedOrders = this.formatOrderSummary(
        result.map((r) => r.newOrder),
      );

      return new DataResponseDto(
        formattedOrders,
        true,
        `Created ${result.length} order(s) for ${storeIds.size} seller(s)`,
      );
    } catch (err) {
      appLog.error(
        {
          event: "guest_order_creation_failed",
          paymentReference: data.payment?.payment_reference,
          gateway: data.payment?.payment_reference?.startsWith("budpay_")
            ? "budpay"
            : data.payment?.payment_reference?.startsWith("PP")
            ? "palmpay"
            : "paystack",
          err,
        },
        "guest order creation failed",
      );

      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        `Order creation failed: ${(err as any).message}`,
      );
    }
  }

  private buildGuestOrderWhereClause(
    overrides: Record<string, any> = {},
    email?: string,
  ): WhereOptions<Order> {
    const normalizedEmail = email?.toLowerCase().trim();

    if (normalizedEmail) {
      return {
        ...overrides,
        [Op.or]: [
          {
            is_guest_order: true,
            guest_email: normalizedEmail,
          },
          {
            guest_email: normalizedEmail,
          },
        ],
      };
    }

    // For guest orders: is_guest_order=true OR has guest_email set OR missing/legacy userId values
    return {
      ...overrides,
      [Op.or]: [
        {
          is_guest_order: true,
        },
        {
          [Op.and]: [
            { guest_email: { [Op.ne]: null as any } },
            { guest_email: { [Op.ne]: "" } },
          ],
        },
        {
          userId: null,
        },
        {
          userId: 0,
        },
      ],
    } as any;
  }

  private buildNormalizedGuestAddress(source: any = {}) {
    return {
      full_name: source?.full_name || source?.name || "",
      phone: source?.phone_no || source?.phone || "",
      phone_no: source?.phone_no || source?.phone || "",
      address: source?.full_address || source?.address || "",
      full_address: source?.full_address || source?.address || "",
      fullAddress: source?.full_address || source?.address || "",
      street: source?.full_address || source?.address || "",
      city: source?.city || "",
      state: source?.state || "",
      state_id: source?.state_id || null,
      country: source?.country || "",
      country_id: source?.country_id || null,
      landmark: source?.landmark || null,
      address_type: source?.address_type || source?.type || "home",
      type: source?.address_type || source?.type || "home",
      pin_code: source?.pin_code || source?.pincode || "",
      pincode: source?.pin_code || source?.pincode || "",
      code: source?.country_code || source?.code || "",
      country_code: source?.country_code || source?.code || "",
      alt_phone: source?.phone_no || source?.phone || "",
    };
  }

  private formatGuestOrderRecord(order: any) {
    const normalizedAddress = this.buildNormalizedGuestAddress({
      full_name: order.delivery_full_name,
      phone_no: order.delivery_phone,
      full_address: order.delivery_address,
      city: order.delivery_city,
      state: order.delivery_state,
      state_id: order.delivery_state_id,
      country: order.delivery_country,
      country_id: order.delivery_country_id,
      landmark: order.delivery_landmark,
      address_type: order.delivery_address_type,
      country_code: order.guest_country_code || "",
    });

    return {
      id: order.id,
      order_id: order.order_id,
      status: order.status,
      guest_email: order.guest_email,
      guest_first_name: order.guest_first_name,
      guest_last_name: order.guest_last_name,
      guest_phone: order.guest_phone,
      address: normalizedAddress,
      shipping_address: normalizedAddress,
      delivery_address: normalizedAddress,
      store: order.storeDetails,
      stores: order.storeDetails ? [order.storeDetails] : [],
      items: order.orderItems,
      totalItems: order.totalItems,
      total: order.total,
      deliveryCharge: order.deliveryCharge,
      discount: order.discount,
      tax: order.tax,
      grandTotal: order.grandTotal,
      payment: order.orderPayment,
      delivery_date: order.delivery_date,
      createdAt: order.createdAt,
      orderStatus: order.orderStatus,
      order_notes: order.order_notes,
      is_guest_order: order.is_guest_order,
      record_type: "order",
    };
  }

  private formatOrphanedGuestCheckoutRecord(
    checkout: any,
    storeMap: Map<number, any> = new Map(),
  ) {
    const payload = this.extractGuestCheckoutPayload(checkout.payload);
    const guestInfo = payload?.guest_info || {};
    const deliveryAddress = this.buildNormalizedGuestAddress(
      payload?.delivery_address ||
        payload?.address ||
        payload?.shipping_address ||
        {},
    );
    const cartItems = Array.isArray(payload?.cart_items)
      ? payload.cart_items
      : Array.isArray(payload?.items)
      ? payload.items
      : [];
    const stores = Array.from<number>(
      new Set<number>(
        cartItems
          .map((item: any) => Number(item?.store_id))
          .filter((storeId: number) => Number.isFinite(storeId) && storeId > 0),
      ),
    )
      .map((storeId) => storeMap.get(storeId))
      .filter(Boolean);

    const displayStatus = this.getOrphanedGuestCheckoutDisplayStatus(checkout);
    const statusRemark = this.getOrphanedGuestCheckoutStatusRemark(checkout);

    return {
      id: checkout.id,
      order_id: checkout.reference,
      status: displayStatus,
      guest_email: checkout.guest_email,
      guest_first_name: guestInfo?.first_name || "",
      guest_last_name: guestInfo?.last_name || "",
      guest_phone: guestInfo?.phone || "",
      address: deliveryAddress,
      shipping_address: deliveryAddress,
      delivery_address: deliveryAddress,
      store: stores.length === 1 ? stores[0] : stores[0] || null,
      stores,
      items: cartItems.map((item: any, index: number) => ({
        id: item?.id || `${checkout.id}-${index}`,
        productId:
          item?.product_id ||
          item?.productId ||
          item?.product_pid ||
          item?.productPid ||
          null,
        variantId: item?.variant_id || item?.variantId || null,
        quantity: item?.quantity || 0,
        price: item?.unit_price || item?.price || 0,
        totalPrice:
          item?.totalPrice ||
          Number(item?.quantity || 0) *
            Number(item?.unit_price || item?.price || 0),
        image: item?.image || null,
        name: item?.product_name || item?.name || null,
        sku: item?.sku || null,
        combination: item?.combination || null,
        store_id: item?.store_id || item?.storeId || null,
      })),
      totalItems: cartItems.reduce(
        (sum: number, item: any) => sum + Number(item?.quantity || 0),
        0,
      ),
      total: Number(checkout.amount_kobo || 0) / 100,
      deliveryCharge: 0,
      discount: 0,
      tax: 0,
      grandTotal: Number(checkout.amount_kobo || 0) / 100,
      payment: {
        id: null,
        paymentType: "paystack",
        status: checkout.payment_status,
        ref: checkout.reference,
        amount: Number(checkout.amount_kobo || 0) / 100,
      },
      delivery_date: null,
      createdAt:
        checkout.processed_at || checkout.createdAt || checkout.updatedAt || null,
      orderStatus: [],
      order_notes: checkout.error,
      is_guest_order: true,
      record_type: "orphaned_guest_checkout",
      checkout_status: checkout.status,
      payment_status: checkout.payment_status,
      checkout_reference: checkout.reference,
      status_remark: statusRemark,
    };
  }

  private extractGuestCheckoutPayload(payload: any = {}) {
    for (const candidate of [
      payload,
      payload?.order_payload,
      payload?.guest_order_payload,
      payload?.checkout_payload,
    ]) {
      if (
        candidate &&
        (candidate?.guest_info ||
          candidate?.delivery_address ||
          Array.isArray(candidate?.cart_items))
      ) {
        return candidate;
      }
    }

    return payload;
  }

  private async getOrphanedGuestCheckoutRecords(status?: string) {
    const checkoutWhere: any = {
      payment_status: "success",
      status: { [Op.ne]: "completed" },
    };

    if (status) {
      const normalizedStatus = String(status).toLowerCase();
      const statusFilters: any[] = [{ status }, { payment_status: status }];

      if (
        normalizedStatus === "payment_received_processing" ||
        normalizedStatus === "paid_not_created"
      ) {
        statusFilters.push({
          payment_status: "success",
          status: { [Op.ne]: "completed" },
        });
      }

      checkoutWhere[Op.or] = statusFilters;
    }

    const guestCheckouts = await this.guestCheckoutRepository.findAll({
      where: checkoutWhere,
      order: [["createdAt", "DESC"]],
    });

    if (!guestCheckouts.length) {
      return [];
    }

    const references = guestCheckouts
      .map((checkout: any) => checkout.reference)
      .filter(Boolean);

    const existingOrders = references.length
      ? await this.orderRepository.findAll({
          where: {
            payment_reference: {
              [Op.in]: references,
            },
          } as any,
          attributes: ["payment_reference"],
          raw: true,
        })
      : [];

    const existingReferences = new Set(
      existingOrders
        .map((order: any) => order.payment_reference)
        .filter(Boolean),
    );

    const orphanedCheckouts = guestCheckouts.filter(
      (checkout: any) => !existingReferences.has(checkout.reference),
    );

    if (!orphanedCheckouts.length) {
      return [];
    }

    const storeIds = Array.from<number>(
      new Set<number>(
        orphanedCheckouts.flatMap((checkout: any) => {
          const payload = this.extractGuestCheckoutPayload(checkout.payload);
          const cartItems = Array.isArray(payload?.cart_items)
            ? payload.cart_items
            : Array.isArray(payload?.items)
            ? payload.items
            : [];

          return cartItems
            .map((item: any) => Number(item?.store_id))
            .filter((storeId: number) => Number.isFinite(storeId) && storeId > 0);
        }),
      ),
    );

    const storeMap = new Map<number, any>();

    if (storeIds.length) {
      const stores = await Store.findAll({
        where: { id: { [Op.in]: storeIds } },
        attributes: [
          "id",
          "name",
          "store_name",
          "email",
          "phone",
          "business_address",
          "logo_upload",
          "slug",
        ],
        raw: true,
      });

      for (const store of stores) {
        storeMap.set(Number((store as any).id), store);
      }
    }

    return orphanedCheckouts.map((checkout: any) =>
      this.formatOrphanedGuestCheckoutRecord(checkout, storeMap),
    );
  }

  async getGuestOrderDetails(
    id: number,
    role: string,
    storeId?: number,
  ): Promise<DataResponseDto> {
    const order = await this.orderRepository.findByPk(id, {
      include: [
        {
          model: OrderItems,
          as: "orderItems",
          attributes: [
            "id",
            "productId",
            "variantId",
            "quantity",
            "price",
            "totalPrice",
            "image",
            "name",
            "sku",
            "combination",
          ],
        },
        {
          model: OrderPayments,
          as: "orderPayment",
          attributes: ["id", "paymentType", "status", "ref", "amount"],
        },
        {
          model: OrderStatus,
          as: "orderStatus",
          attributes: ["id", "status", "remark", "createdAt"],
          separate: true,
          order: [["createdAt", "DESC"]],
        },
        {
          model: Store,
          as: "storeDetails",
          attributes: [
            "id",
            "name",
            "store_name",
            "email",
            "phone",
            "business_address",
            "logo_upload",
            "slug",
          ],
        },
      ],
    });

    if (order) {
      const isGuestOrder =
        order.is_guest_order === true ||
        Boolean(order.guest_email) ||
        order.userId === null ||
        Number(order.userId) === 0;

      if (!isGuestOrder) {
        throw new NotFoundException("Guest order not found");
      }

      if (role !== Role.Admin && Number(order.storeId) !== Number(storeId)) {
        throw new NotFoundException("Guest order not found");
      }

      return new DataResponseDto(
        this.formatGuestOrderRecord(order),
        true,
        "Guest order retrieved successfully",
      );
    }

    const checkout = await this.guestCheckoutRepository.findByPk(id as any);

    if (!checkout) {
      throw new NotFoundException("Guest order not found");
    }

    const payload = this.extractGuestCheckoutPayload(checkout.payload);
    const cartItems = Array.isArray(payload?.cart_items)
      ? payload.cart_items
      : Array.isArray(payload?.items)
      ? payload.items
      : [];
    const storeIds = Array.from<number>(
      new Set(
        cartItems
          .map((item: any) => Number(item?.store_id ?? item?.storeId))
          .filter((value: number) => Number.isFinite(value) && value > 0),
      ),
    );

    if (role !== Role.Admin) {
      if (!storeIds.length || !storeIds.includes(Number(storeId))) {
        throw new NotFoundException("Guest order not found");
      }
    }

    const stores = storeIds.length
      ? await Store.findAll({
          where: { id: { [Op.in]: storeIds } },
          attributes: [
            "id",
            "name",
            "store_name",
            "email",
            "phone",
            "business_address",
            "logo_upload",
            "slug",
          ],
          raw: true,
        })
      : [];

    const storeMap = new Map<number, any>();
    for (const store of stores) {
      storeMap.set(Number((store as any).id), store);
    }

    return new DataResponseDto(
      this.formatOrphanedGuestCheckoutRecord(checkout, storeMap),
      true,
      "Guest order retrieved successfully",
    );
  }

  /** Get all Guest Orders */
  async getAllGuestOrders(
    pageOptions: PageOptionsGetOrdersDto,
  ): Promise<DataResponseDto> {
    try {
      appLog.info("=== FETCHING ALL GUEST ORDERS ===");

      const whereClause: any = this.buildGuestOrderWhereClause();
      appLog.info("Where Clause:", JSON.stringify(whereClause, null, 2));

      if (pageOptions.status) {
        whereClause.status = pageOptions.status;
      }

      const limit = pageOptions.take || 10;
      const offset = ((pageOptions.page || 1) - 1) * limit;
      const orderDirection = pageOptions.order === "ASC" ? "ASC" : "DESC";

      const orders = await this.orderRepository.findAll({
        where: whereClause,
        include: [
          {
            model: OrderItems,
            as: "orderItems",
            attributes: [
              "id",
              "productId",
              "variantId",
              "quantity",
              "price",
              "totalPrice",
              "image",
              "name",
              "sku",
              "combination",
            ],
          },
          {
            model: OrderPayments,
            as: "orderPayment",
            attributes: ["id", "paymentType", "status", "ref", "amount"],
          },
          {
            model: OrderStatus,
            as: "orderStatus",
            attributes: ["id", "status", "remark", "createdAt"],
            separate: true,
            order: [["createdAt", "DESC"]],
          },
          {
            model: Store,
            as: "storeDetails",
            attributes: [
              "id",
              "name",
              "store_name",
              "email",
              "phone",
              "business_address",
              "logo_upload",
              "slug",
            ],
          },
        ],
        order: [["createdAt", orderDirection]],
      });

      const formattedOrders = orders.map((order: any) =>
        this.formatGuestOrderRecord(order),
      );
      const orphanedCheckouts = await this.getOrphanedGuestCheckoutRecords(
        pageOptions.status,
      );
      const combinedRecords = [...formattedOrders, ...orphanedCheckouts].sort(
        (left: any, right: any) => {
          const leftTime = left?.createdAt
            ? new Date(left.createdAt).getTime()
            : 0;
          const rightTime = right?.createdAt
            ? new Date(right.createdAt).getTime()
            : 0;

          return orderDirection === "ASC"
            ? leftTime - rightTime
            : rightTime - leftTime;
        },
      );
      const paginatedRecords = combinedRecords.slice(offset, offset + limit);

      return new DataResponseDto(
        paginatedRecords,
        true,
        "All guest orders retrieved successfully",
        pageOptions,
        combinedRecords.length,
      );
    } catch (err) {
      appLog.error("=== FAILED TO FETCH ALL GUEST ORDERS ===");
      appLog.error("Error:", (err as any).message);

      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException("Failed to retrieve guest orders");
    }
  }

  async reconcileGuestCheckout(id: number): Promise<DataResponseDto> {
    const checkout = await this.guestCheckoutRepository.findByPk(id as any);

    if (!checkout) {
      throw new NotFoundException("Guest checkout not found");
    }

    if (checkout.payment_status !== "success") {
      throw new BadRequestException(
        "Only successfully paid guest checkouts can be reconciled",
      );
    }

    if (checkout.status === "completed") {
      const existingOrders = await this.orderRepository.findAll({
        where: {
          payment_reference: checkout.reference,
        } as any,
        order: [["createdAt", "ASC"]],
      });

      return new DataResponseDto(
        this.formatOrderSummary(existingOrders),
        true,
        "Guest checkout has already been reconciled",
      );
    }

    const rawPayload = this.extractGuestCheckoutPayload(checkout.payload);
    if (!rawPayload || !Array.isArray(rawPayload?.cart_items)) {
      throw new BadRequestException(
        "Guest checkout payload is missing cart items and cannot be reconciled",
      );
    }

    const paymentReference =
      rawPayload?.payment?.payment_reference || checkout.reference;
    const paystackResponse: any = paymentReference.startsWith("budpay_")
      ? await this.budPayService.verifyPayment({ reference: paymentReference })
      : paymentReference.startsWith("PP")
      ? await this.palmPayService.verifyPayment(paymentReference)
      : await this.paystackService.verifyPayment({ reference: paymentReference });

    const payload: CreateGuestOrderDto = {
      ...rawPayload,
      payment: {
        ...(rawPayload?.payment || {}),
        payment_reference: paymentReference,
        payment_status: "success",
      },
    };

    await checkout.update({
      status: "processing",
      error: null,
    });

    try {
      const orders = await this.replayGuestCheckout(checkout, payload, paystackResponse?.data);

      return new DataResponseDto(
        orders,
        true,
        "Guest checkout reconciled successfully",
      );
    } catch (error) {
      await checkout.update({
        status: "failed",
        error:
          (error as any)?.message || "Guest checkout reconciliation failed",
      });
      throw error;
    }
  }

  async reconcileAllGuestCheckouts(): Promise<DataResponseDto> {
    const checkoutWhere: any = {
      payment_status: "success",
      status: { [Op.ne]: "completed" },
    };

    const guestCheckouts = await this.guestCheckoutRepository.findAll({
      where: checkoutWhere,
      order: [["createdAt", "ASC"]],
    });

    if (!guestCheckouts.length) {
      return new DataResponseDto(
        {
          summary: {
            total: 0,
            reconciled: 0,
            skipped: 0,
            failed: 0,
          },
          results: [],
        },
        true,
        "No guest checkouts available for reconciliation",
      );
    }

    const references = guestCheckouts
      .map((checkout: any) => checkout.reference)
      .filter(Boolean);

    const existingOrders = references.length
      ? await this.orderRepository.findAll({
          where: {
            payment_reference: {
              [Op.in]: references,
            },
          } as any,
          attributes: ["payment_reference"],
          raw: true,
        })
      : [];

    const existingReferences = new Set(
      existingOrders
        .map((order: any) => order.payment_reference)
        .filter(Boolean),
    );

    const results: Array<{
      id: number;
      reference: string;
      action: "reconciled" | "skipped" | "failed";
      reason: string;
      order_ids?: number[];
    }> = [];

    for (const checkout of guestCheckouts) {
      if (existingReferences.has(checkout.reference)) {
        results.push({
          id: checkout.id,
          reference: checkout.reference,
          action: "skipped",
          reason: "Order already exists for this payment reference",
        });
        continue;
      }

      const rawPayload = this.extractGuestCheckoutPayload(checkout.payload);
      if (!rawPayload || !Array.isArray(rawPayload?.cart_items)) {
        results.push({
          id: checkout.id,
          reference: checkout.reference,
          action: "skipped",
          reason:
            "Guest checkout payload is missing cart items and cannot be reconciled",
        });
        continue;
      }

      const paymentReference =
        rawPayload?.payment?.payment_reference || checkout.reference;

      try {
        const paystackResponse: any = paymentReference.startsWith("budpay_")
          ? await this.budPayService.verifyPayment({ reference: paymentReference })
          : paymentReference.startsWith("PP")
          ? await this.palmPayService.verifyPayment(paymentReference)
          : await this.paystackService.verifyPayment({ reference: paymentReference });

        const payload: CreateGuestOrderDto = {
          ...rawPayload,
          payment: {
            ...(rawPayload?.payment || {}),
            payment_reference: paymentReference,
            payment_status: "success",
          },
        };

        await checkout.update({
          status: "processing",
          error: null,
        });

        const orders = await this.replayGuestCheckout(
          checkout,
          payload,
          paystackResponse?.data,
        );

        results.push({
          id: checkout.id,
          reference: checkout.reference,
          action: "reconciled",
          reason: "Guest checkout reconciled successfully",
          order_ids: orders.map((order: any) => Number(order?.id)).filter(Boolean),
        });
      } catch (error) {
        await checkout.update({
          status: "failed",
          error:
            (error as any)?.message || "Guest checkout reconciliation failed",
        });

        results.push({
          id: checkout.id,
          reference: checkout.reference,
          action: "failed",
          reason:
            (error as any)?.message || "Guest checkout reconciliation failed",
        });
      }
    }

    const summary = results.reduce(
      (acc, result) => {
        acc.total += 1;
        acc[result.action] += 1;
        return acc;
      },
      {
        total: 0,
        reconciled: 0,
        skipped: 0,
        failed: 0,
      },
    );

    return new DataResponseDto(
      {
        summary,
        results,
      },
      true,
      "Guest checkout bulk reconciliation completed",
    );
  }

  async getGuestOrdersByStore(
    storeId: number,
    pageOptions: PageOptionsGetOrdersDto,
  ): Promise<DataResponseDto> {
    try {
      appLog.info("=== FETCHING STORE GUEST ORDERS ===");

      const whereClause: any = this.buildGuestOrderWhereClause({ storeId });

      if (pageOptions.status) {
        whereClause.status = pageOptions.status;
      }

      const limit = pageOptions.take || 10;
      const offset = ((pageOptions.page || 1) - 1) * limit;

      const { count, rows: orders } =
        await this.orderRepository.findAndCountAll({
          where: whereClause,
          include: [
            {
              model: OrderItems,
              as: "orderItems",
              attributes: [
                "id",
                "productId",
                "variantId",
                "quantity",
                "price",
                "totalPrice",
                "image",
                "name",
                "sku",
                "combination",
              ],
            },
            {
              model: OrderPayments,
              as: "orderPayment",
              attributes: ["id", "paymentType", "status", "ref", "amount"],
            },
            {
              model: OrderStatus,
              as: "orderStatus",
              attributes: ["id", "status", "remark", "createdAt"],
              separate: true,
              order: [["createdAt", "DESC"]],
            },
            {
              model: Store,
              as: "storeDetails",
              attributes: [
                "id",
                "name",
                "store_name",
                "email",
                "phone",
                "business_address",
                "logo_upload",
                "slug",
              ],
            },
          ],
          limit,
          offset,
          order: [["createdAt", "DESC"]],
          distinct: true,
        });

      const formattedOrders = orders.map((order: any) => {
        const normalizedAddress = {
          full_name: order.delivery_full_name,
          phone: order.delivery_phone,
          phone_no: order.delivery_phone,
          address: order.delivery_address,
          full_address: order.delivery_address,
          fullAddress: order.delivery_address,
          street: order.delivery_address,
          city: order.delivery_city,
          state: order.delivery_state,
          state_id: order.delivery_state_id,
          country: order.delivery_country,
          country_id: order.delivery_country_id,
          landmark: order.delivery_landmark,
          address_type: order.delivery_address_type,
          type: order.delivery_address_type,
          pin_code: "",
          pincode: "",
          code: order.guest_country_code || "",
          country_code: order.guest_country_code || "",
          alt_phone: order.delivery_phone,
        };

        return {
          id: order.id,
          order_id: order.order_id,
          status: order.status,
          guest_email: order.guest_email,
          guest_first_name: order.guest_first_name,
          guest_last_name: order.guest_last_name,
          guest_phone: order.guest_phone,
          address: normalizedAddress,
          shipping_address: normalizedAddress,
          delivery_address: normalizedAddress,
          store: order.storeDetails,
          items: order.orderItems,
          totalItems: order.totalItems,
          total: order.total,
          deliveryCharge: order.deliveryCharge,
          discount: order.discount,
          tax: order.tax,
          grandTotal: order.grandTotal,
          payment: order.orderPayment,
          delivery_date: order.delivery_date,
          createdAt: order.createdAt,
          orderStatus: order.orderStatus,
          order_notes: order.order_notes,
          is_guest_order: order.is_guest_order,
        };
      });

      return new DataResponseDto(
        formattedOrders,
        true,
        "Store guest orders retrieved successfully",
        pageOptions,
        count,
      );
    } catch (err) {
      appLog.error("=== FAILED TO FETCH STORE GUEST ORDERS ===");
      appLog.error("Error:", (err as any).message);

      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        "Failed to retrieve store guest orders",
      );
    }
  }

  // ==================== GET GUEST ORDERS ====================

  async getGuestOrders(
    data: GetGuestOrdersDto,
    pageOptions: PageOptionsGetOrdersDto,
  ): Promise<DataResponseDto> {
    try {
      // Build where clause
      const whereClause: any = this.buildGuestOrderWhereClause({}, data.email);

      // Add order_id filter if provided
      if (data.order_id && data.order_id.trim() !== "") {
        whereClause.order_id = data.order_id.trim();
      }

      // Add status filter if provided
      if (pageOptions.status) {
        whereClause.status = pageOptions.status;
      }

      // Calculate pagination
      const limit = pageOptions.take || 10;
      const offset = ((pageOptions.page || 1) - 1) * limit;

      // Fetch orders
      const { count, rows: orders } =
        await this.orderRepository.findAndCountAll({
          where: whereClause,
          include: [
            {
              model: OrderItems,
              as: "orderItems",
              attributes: [
                "id",
                "productId",
                "variantId",
                "quantity",
                "price",
                "totalPrice",
                "image",
                "name",
                "sku",
                "combination",
              ],
            },
            {
              model: OrderPayments,
              as: "orderPayment",
              attributes: ["id", "paymentType", "status", "ref", "amount"],
            },
            {
              model: OrderStatus,
              as: "orderStatus",
              attributes: ["id", "status", "remark", "createdAt"],
              separate: true,
              order: [["createdAt", "DESC"]],
            },
            {
              model: Store,
              as: "storeDetails",
              attributes: [
                "id",
                "name",
                "store_name",
                "email",
                "phone",
                "business_address",
                "logo_upload",
                "slug",
              ],
            },
          ],
          limit,
          offset,
          order: [["createdAt", "DESC"]],
          distinct: true,
        });

      // Handle no orders found
      if (orders.length === 0) {
        if (data.order_id && data.order_id.trim() !== "") {
          throw new NotFoundException(
            `Order "${data.order_id}" not found for email ${data.email}`,
          );
        }

        return new DataResponseDto(
          [],
          true,
          "No orders found for this email address",
          pageOptions,
          0,
        );
      }

      // Format response
      const formattedOrders = orders.map((order: any) => {
        const normalizedAddress = {
          full_name: order.delivery_full_name,
          phone: order.delivery_phone,
          phone_no: order.delivery_phone,
          address: order.delivery_address,
          full_address: order.delivery_address,
          fullAddress: order.delivery_address,
          street: order.delivery_address,
          city: order.delivery_city,
          state: order.delivery_state,
          state_id: order.delivery_state_id,
          country: order.delivery_country,
          country_id: order.delivery_country_id,
          landmark: order.delivery_landmark,
          address_type: order.delivery_address_type,
          type: order.delivery_address_type,
          pin_code: "",
          pincode: "",
          code: order.guest_country_code || "",
          country_code: order.guest_country_code || "",
          alt_phone: order.delivery_phone,
        };

        return {
          id: order.id,
          order_id: order.order_id,
          status: order.status,
          guest_email: order.guest_email,
          guest_first_name: order.guest_first_name,
          guest_last_name: order.guest_last_name,
          guest_phone: order.guest_phone,
          address: normalizedAddress,
          shipping_address: normalizedAddress,
          delivery_address: normalizedAddress,
          store: order.storeDetails,
          items: order.orderItems,
          totalItems: order.totalItems,
          total: order.total,
          deliveryCharge: order.deliveryCharge,
          discount: order.discount,
          tax: order.tax,
          grandTotal: order.grandTotal,
          payment: order.orderPayment,
          delivery_date: order.delivery_date,
          createdAt: order.createdAt,
          orderStatus: order.orderStatus,
          order_notes: order.order_notes,
        };
      });

      return new DataResponseDto(
        formattedOrders,
        true,
        "Orders retrieved successfully",
        pageOptions,
        count,
      );
    } catch (err) {
      appLog.error("=== FAILED TO FETCH GUEST ORDERS ===");
      appLog.error("Error:", (err as any).message);

      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException("Failed to retrieve orders");
    }
  }

  async updateGuestOrder(id: number, data: UpdateOrderStatus) {
    try {
      const result = await this.orderRepository.sequelize!.transaction(
        async (transaction: Transaction) => {
          const order: any = await this.findGuestOrderForUpdate(id, transaction);

          if (!order) {
            throw new NotFoundException("Order not found");
          }

          const isGuestOrder =
            order.is_guest_order === true ||
            Boolean(order.guest_email) ||
            order.userId === null ||
            Number(order.userId) === 0;

          if (!isGuestOrder) {
            throw new BadRequestException("This is not a guest order");
          }

          const terminalStatuses = [
            "failed",
            "delivered",
            "cancelled",
            "rejected",
          ];

          if (terminalStatuses.includes(order.status)) {
            throw new BadRequestException(
              `Cannot update order with '${order.status}' status`,
            );
          }

          order.status = data.status;

          if (data?.delivery_date) {
            order.delivery_date = data.delivery_date;
          }

          await order.save({ transaction });

          if (order.paymentType === "Pay On Credit") {
            const paymentInfo = await order.getOrderPayment({ transaction });
            if (paymentInfo && paymentInfo.status === "pending") {
              await paymentInfo.update({ status: "approved" }, { transaction });
            }
          }

          if (data.status === "delivered") {
            const paymentInfo = await order.getOrderPayment({ transaction });
            if (paymentInfo) {
              await paymentInfo.update({ status: "success" }, { transaction });
            }

            if (order.userId) {
              await this.notificationService.createNotification(
                "order",
                `Your order has been delivered. Thank you for shopping with ${process.env.NAME}`,
                "Order Delivered",
                order.order_id,
                order.userId,
              );
            }
          }

          await OrderStatus.create(
            {
              orderId: order.id,
              status: order.status,
              remark: data.remark ?? "Your order status has been updated.",
            } as any,
            { transaction },
          );

          // Post-commit side effects (email)
          transaction.afterCommit(async () => {
            try {
              appLog.info(
                "📧 Sending guest order status update email for order #" +
                  order.order_id,
              );

              // Fetch complete order with relationships
              const completedOrder: any = await this.orderRepository.findByPk(
                order.id,
                {
                  include: [
                    {
                      model: OrderItems,
                      as: "orderItems",
                      attributes: [
                        "id",
                        "productId",
                        "variantId",
                        "quantity",
                        "price",
                        "totalPrice",
                        "image",
                        "name",
                        "sku",
                      ],
                    },
                    {
                      model: Store,
                      as: "storeDetails",
                      attributes: [
                        "id",
                        "name",
                        "store_name",
                        "email",
                        "phone",
                        "business_address",
                        "logo_upload",
                      ],
                    },
                  ],
                },
              );

              if (!completedOrder) {
                throw new Error(
                  "Failed to fetch complete order for email sending",
                );
              }

              // Build guest user object
              const guestUser = {
                name: `${completedOrder.guest_first_name || ""} ${
                  completedOrder.guest_last_name || ""
                }`.trim(),
                email: String(completedOrder.guest_email || "")
                  .trim()
                  .toLowerCase(),
                phone: completedOrder.guest_phone,
                fcmtoken: null,
              };

              // Build address object
              const guestAddressObject = {
                full_name: completedOrder.delivery_full_name,
                phone: completedOrder.delivery_phone,
                phone_no: completedOrder.delivery_phone,
                full_address: completedOrder.delivery_address,
                address: completedOrder.delivery_address,
                city: completedOrder.delivery_city,
                state: completedOrder.delivery_state,
                state_id: completedOrder.delivery_state_id,
                country: completedOrder.delivery_country,
                country_id: completedOrder.delivery_country_id,
                landmark: completedOrder.delivery_landmark,
                address_type: completedOrder.delivery_address_type,
              };

              // Get order items details
              const orderItems = completedOrder.orderItems || [];

              // Get store details
              const store = completedOrder.storeDetails;

              if (!store) {
                throw new Error("Store details not found for order");
              }

              // Build and send email
              const email = (await OrderUpdateMail(
                completedOrder,
                guestUser,
                store,
                orderItems,
                guestAddressObject,
              )) as {
                to?: string;
                subject?: string;
                template?: string;
              };

              if (!email?.template) {
                throw new Error("Failed to build status update email");
              }

              // Ensure email recipient is set to guest
              email.to = guestUser.email;

              await this.mailService.sellerEmails(email);
            } catch (err) {
              // Never crash the app after commit
              appLog.error(
                "Failed to send guest order status update email:",
                err,
              );
            }
          });

          return order;
        },
      );

      return new DataResponseDto(result, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        `Failed to update guest order: ${
          (err as any)?.message || "Unknown error"
        }`,
      );
    }
  }

  private async findGuestOrderForUpdate(
    identifier: number,
    transaction: Transaction,
  ) {
    const orderByPrimaryKey = await this.orderRepository.findByPk(identifier, {
      transaction,
    });

    if (orderByPrimaryKey) {
      return orderByPrimaryKey;
    }

    return this.orderRepository.findOne({
      where: { order_id: identifier },
      transaction,
    });
  }

  // ==================== VALIDATION ====================

  private async basicCheck(
    data: CreateGuestOrderDto,
    options: GuestOrderCreationOptions = {},
  ) {
    try {
      // 1. Validate cart
      if (!Array.isArray(data.cart_items) || data.cart_items.length === 0) {
        throw new BadRequestException("No products selected");
      }

      // 2. Validate guest info
      if (!data.guest_info?.email) {
        throw new BadRequestException("Guest email is required");
      }

      if (!data.guest_info?.first_name || !data.guest_info?.last_name) {
        throw new BadRequestException("Guest name is required");
      }

      // 3. Validate delivery address
      if (!data.delivery_address?.state_id) {
        throw new BadRequestException("Delivery state is required");
      }

      if (!data.delivery_address?.full_address) {
        throw new BadRequestException("Delivery address is required");
      }

      // 4. Validate payment
      if (!data.payment.payment_reference) {
        throw new BadRequestException("Payment reference is required");
      }

      // 5. Decode delivery token
      let verified: any = options.verifiedDeliveryData;

      if (!verified) {
        if (options.skipDeliveryTokenVerification) {
          verified = this.jwtService.decode(data.delivery.delivery_token);
        } else {
          verified = await this.jwtService.verifyAsync(
            data.delivery.delivery_token,
          );
        }
      }

      if (!verified || !verified?.data) {
        throw new BadRequestException("Invalid delivery token");
      }

      if (verified?.data?.isGuest != null && verified.data.isGuest !== true) {
        throw new BadRequestException("Invalid guest delivery token");
      }

      if (
        data.delivery_address?.id &&
        String(verified?.data?.addressId) !== String(data.delivery_address.id)
      ) {
        throw new BadRequestException(
          "Delivery token does not match the selected address.",
        );
      }

      // 6. Check token expiry
      if (!options.skipDeliveryTokenVerification) {
        const now = Math.floor(Date.now() / 1000);
        if (verified.exp && verified.exp < now) {
          throw new BadRequestException(
            "Delivery token expired. Please recalculate delivery.",
          );
        }
      }

      return verified;
    } catch (err) {
      appLog.warn(
        { event: "guest_order_basic_check_failed", err },
        "guest order delivery token validation failed",
      );
      if (err instanceof HttpException) {
        throw err;
      }
      throw new BadRequestException(
        "Invalid or expired delivery token. Please recalculate delivery.",
      );
    }
  }

  // ==================== PAYMENT VERIFICATION ====================

  private async verifyPaymentReference(
    paymentReference: string,
    expectedAmountInKobo: number | null,
    guestEmail: string,
  ): Promise<void> {
    try {
      const gateway = paymentReference.startsWith("budpay_")
        ? "budpay"
        : paymentReference.startsWith("PP")
        ? "palmpay"
        : "paystack";
      appLog.info(
        {
          event: "payment_verification_started",
          paymentReference,
          gateway,
          amount: expectedAmountInKobo,
        },
        "guest payment verification started",
      );

      const paystackResponse: any =
        gateway === "budpay"
          ? await this.budPayService.verifyPayment({
              reference: paymentReference,
            })
          : gateway === "palmpay"
          ? await this.palmPayService.verifyPayment(paymentReference)
          : await this.paystackService.verifyPayment({
              reference: paymentReference,
            });
      this.assertVerifiedPaymentData(
        paystackResponse.data,
        paymentReference,
        expectedAmountInKobo,
        guestEmail,
      );

      appLog.info(
        {
          event: "payment_verification_succeeded",
          paymentReference,
          gateway,
          paymentStatus: paystackResponse.data?.status,
          amount: paystackResponse.data?.amount,
        },
        "guest payment verified",
      );
    } catch (err) {
      appLog.error(
        {
          event: "payment_verification_failed",
          paymentReference,
          gateway: paymentReference.startsWith("budpay_")
            ? "budpay"
            : paymentReference.startsWith("PP")
            ? "palmpay"
            : "paystack",
          amount: expectedAmountInKobo,
          err,
        },
        "guest payment verification failed",
      );
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        "Payment verification failed. Please try again.",
      );
    }
  }

  private assertVerifiedPaymentData(
    paymentData: any,
    paymentReference: string,
    expectedAmountInKobo: number | null,
    guestEmail: string,
  ) {
    if (!paymentData || paymentData.status !== "success") {
      throw new BadRequestException(
        "Payment verification failed. Payment not successful.",
      );
    }

    if (paymentData.reference && paymentData.reference !== paymentReference) {
      throw new BadRequestException("Payment reference mismatch.");
    }

    const paymentEmail = paymentData.customer?.email?.toLowerCase();
    if (paymentEmail !== guestEmail.toLowerCase()) {
      throw new BadRequestException(
        "Payment email does not match guest email.",
      );
    }

    const amountInKobo = Number(paymentData.amount);
    if (expectedAmountInKobo != null && amountInKobo !== expectedAmountInKobo) {
      appLog.warn(
        {
          event: "payment_amount_mismatch",
          paymentReference,
          expectedAmount: expectedAmountInKobo,
          amount: amountInKobo,
          gateway: paymentReference.startsWith("budpay_")
            ? "budpay"
            : paymentReference.startsWith("PP")
            ? "palmpay"
            : "paystack",
        },
        "verified payment amount does not match order total",
      );
      throw new BadRequestException(
        "Payment amount does not match order total.",
      );
    }
  }

  private async findGuestProductByStoredItemFields(
    item: any,
    transaction: Transaction,
  ) {
    const storeId = Number(item?.store_id ?? item?.storeId);
    const productName = String(item?.product_name ?? item?.name ?? "").trim();
    const productImage = String(item?.image ?? "").trim();

    if (!Number.isFinite(storeId) || storeId <= 0 || !productName) {
      return null;
    }

    const where: WhereOptions = {
      store_id: storeId,
      name: productName,
    };

    if (productImage) {
      Object.assign(where, { image: productImage });
    }

    const matchingProducts = await Products.findAll({
      attributes: ["_id", "pid", "store_id", "status", "name", "image"],
      where,
      transaction,
      limit: 2,
    });

    if (matchingProducts.length !== 1) {
      return null;
    }

    return matchingProducts[0];
  }

  private async resolveGuestCartProduct(item: any, transaction: Transaction) {
    const rawProductIdentifier =
      item?.product_id ??
      item?.productId ??
      item?.product_pid ??
      item?.productPid;
    const numericProductId = Number(rawProductIdentifier);
    const productWhere = Number.isFinite(numericProductId)
      ? { _id: numericProductId }
      : typeof rawProductIdentifier === "string" &&
          rawProductIdentifier.trim().length > 0
        ? { pid: rawProductIdentifier.trim() }
        : null;

    if (productWhere) {
      const product = await Products.findOne({
        attributes: ["_id", "pid", "store_id", "status", "name", "image"],
        where: productWhere,
        transaction,
      });

      if (product) {
        return product;
      }
    }

    const fallbackProduct = await this.findGuestProductByStoredItemFields(
      item,
      transaction,
    );

    if (fallbackProduct) {
      return fallbackProduct;
    }

    throw new NotFoundException(
      `Product identifier ${String(rawProductIdentifier || 0)} not found`,
    );
  }

  // ==================== GROUPING ====================

  private async groupProducts(cartItems: any[], transaction: Transaction) {
    try {
      const grouped = new Map();

      for (const item of cartItems) {
        const rawProductIdentifier =
          item?.product_id ??
          item?.productId ??
          item?.product_pid ??
          item?.productPid;
        const product = await this.resolveGuestCartProduct(item, transaction);

        if (product.status === false) {
          throw new ServiceUnavailableException(
            `Product "${product.name}" is not available`,
          );
        }

        const storeId = item.store_id ?? product.store_id;

        // Verify store matches
        if (product.store_id !== storeId) {
          throw new BadRequestException(
            `Product ${item.product_id} does not belong to store ${storeId}`,
          );
        }

        if (!grouped.has(storeId)) {
          grouped.set(storeId, {
            storeId,
            products: [],
          });
        }

        grouped.get(storeId).products.push({
          productId: product._id,
          variantId: item.variant_id || null,
          quantity: item.quantity,
          productName: item.product_name,
          variantName: item.variant_name,
          weight: item.weight,
        });
      }

      appLog.info(`📦 Grouped into ${grouped.size} store(s)`);
      return Array.from(grouped.values());
    } catch (err) {
      throw err;
    }
  }

  /**
   * The amount the guest must actually have paid on Paystack, recomputed
   * entirely from the database (product/variant prices) and the
   * cryptographically verified delivery token — never from the client's
   * order_summary/cart_items prices. This is the last gate before an order
   * is created; if it trusted client-supplied prices, a tampered checkout
   * payload could pay pennies for real goods since createItems() always
   * writes the real product price onto the order regardless of what was paid.
   */
  private async getExpectedGuestPaymentAmountInKobo(
    data: CreateGuestOrderDto,
    verified: any,
  ): Promise<number> {
    const subtotal = await this.calculateGuestCartSubtotalNaira(
      data.cart_items,
    );
    const deliveryCharge = Number(verified?.data?.amount ?? 0);
    const tax = Number(verified?.data?.tax ?? 0);
    const discount = this.getDiscountAmount(verified?.data?.discount);
    const total = subtotal + deliveryCharge + tax - discount;

    return Math.round(Math.max(total, 0) * 100);
  }

  private getDiscountAmount(discount: unknown): number {
    if (Array.isArray(discount)) {
      return discount.reduce(
        (sum, item) => sum + Number(item?.discount ?? 0),
        0,
      );
    }

    const numericDiscount = Number(discount);
    return Number.isFinite(numericDiscount) ? numericDiscount : 0;
  }

  private buildVerifiedDeliveryDataFromGuestPayload(
    payload: CreateGuestOrderDto,
  ): {
    data: {
      amount: number;
      status: boolean;
      addressId: string | number | null;
      discount: number;
      tax: number;
      totalWeight: number;
      isGuest: boolean;
    };
  } {
    const deliveryCharge = Number(
      payload?.delivery?.delivery_charge ??
        payload?.order_summary?.delivery_fee,
    );
    const discount = Number(payload?.order_summary?.discount);
    const tax = Number(payload?.order_summary?.tax);
    const totalWeight = Array.isArray(payload?.cart_items)
      ? payload.cart_items.reduce((sum, item) => {
          const quantity = Number(item?.quantity || 0);
          const weight = Number(item?.weight || 0);
          return sum + (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(weight) ? weight : 0);
        }, 0)
      : 0;

    return {
      data: {
        amount: Number.isFinite(deliveryCharge) ? deliveryCharge : 0,
        status: true,
        addressId: payload?.delivery_address?.id ?? null,
        discount: Number.isFinite(discount) ? discount : 0,
        tax: Number.isFinite(tax) ? tax : 0,
        totalWeight: totalWeight > 0 ? totalWeight : 1,
        isGuest: true,
      },
    };
  }

  private async replayGuestCheckout(
    checkout: any,
    payload: CreateGuestOrderDto,
    verifiedPaymentData: any,
  ): Promise<any[]> {
    const result = await this.createGuestOrder(payload, {
      skipPaymentVerification: true,
      verifiedPaymentData,
      skipDeliveryTokenVerification: true,
      verifiedDeliveryData:
        this.buildVerifiedDeliveryDataFromGuestPayload(payload),
    });

    const orders = Array.isArray(result?.data) ? result.data : [];

    await checkout.update({
      status: "completed",
      processed_at: new Date(),
      order_ids: orders.map((order: any) => Number(order?.id)).filter(Boolean),
      error: null,
    });

    return orders;
  }

  private formatOrderSummary(orders: Array<Partial<Order>>) {
    return orders.map((order: any) => ({
      id: order.id,
      order_id: order.order_id,
      status: order.status,
      storeId: order.storeId,
      grandTotal: order.grandTotal,
      deliveryCharge: order.deliveryCharge,
      totalItems: order.totalItems,
      is_multi_seller: order.is_multi_seller,
      payment_reference: order.payment_reference,
      guest_email: order.guest_email,
      delivery_date: order.delivery_date,
      createdAt: order.createdAt,
    }));
  }

  // ==================== ORDER CREATION ====================

  private async placeGuestOrder(
    data: CreateGuestOrderDto,
    storeGroup: any,
    verified: any,
    transaction: Transaction,
    isMultiSeller: boolean,
    paymentReference: string,
  ) {
    try {
      // Calculate store-specific delivery charge
      let storeDeliveryCharge = 0;
      if (Array.isArray(verified?.data?.deliveryCharges)) {
        const chargeObj = verified.data.deliveryCharges.find(
          (item: any) => item?.storeId === storeGroup.storeId,
        );
        storeDeliveryCharge = chargeObj?.totalCharge ?? 0;
      } else {
        const storeCount = verified?.data?.storeCount || 1;
        storeDeliveryCharge = (verified?.data?.amount ?? 0) / storeCount;
      }

      // Calculate store-specific discount
      let storeDiscount = 0;
      if (Array.isArray(verified?.data?.discount)) {
        const discountObj = verified.data.discount.find(
          (item: any) => item?.storeId === storeGroup.storeId,
        );
        storeDiscount = discountObj?.discount ?? 0;
      } else {
        storeDiscount = verified?.data?.discount ?? 0;
      }

      const newOrder = await Order.create(
        {
          // User info - NULL for guests
          userId: null,
          addressId: null,

          // Guest identification
          is_guest_order: true,
          guest_email: data.guest_info.email.toLowerCase().trim(),
          guest_first_name: data.guest_info.first_name,
          guest_last_name: data.guest_info.last_name,
          guest_phone: data.guest_info.phone,
          guest_country_code: data.guest_info.country_code,

          // Delivery address (embedded)
          delivery_full_name: data.delivery_address.full_name,
          delivery_phone: data.delivery_address.phone_no,
          delivery_address: data.delivery_address.full_address,
          delivery_city: data.delivery_address.city,
          delivery_state: data.delivery_address.state,
          delivery_state_id: data.delivery_address.state_id,
          delivery_country: data.delivery_address.country,
          delivery_country_id: data.delivery_address.country_id,
          delivery_landmark: data.delivery_address.landmark || null,
          delivery_address_type: data.delivery_address.address_type || "home",

          // Store
          storeId: storeGroup.storeId,

          // Multi-seller tracking
          is_multi_seller: isMultiSeller,
          payment_reference: paymentReference,

          // Payment
          paymentType: "pay-online",
          transaction_reference: data.payment.transaction_reference,

          // Charges
          tax: verified?.data?.tax ?? 0,
          deliveryCharge: storeDeliveryCharge,
          discount: storeDiscount,

          // Metadata
          order_notes: data.metadata?.order_notes || null,
          preferred_delivery_time:
            data.metadata?.preferred_delivery_time || null,
          order_source: data.metadata?.source || "web",
          device_id: data.metadata?.device_id || null,

          // Status
          status: "pending",
        } as any,
        { transaction },
      );

      appLog.info(
        {
          event: "guest_order_record_created",
          orderId: newOrder.id,
          orderPublicId: newOrder.order_id,
          storeId: storeGroup.storeId,
          paymentReference,
        },
        "guest order record created",
      );
      return newOrder;
    } catch (err) {
      appLog.error(
        {
          event: "guest_order_record_failed",
          storeId: storeGroup.storeId,
          paymentReference,
          err,
        },
        "failed to create guest order record",
      );
      throw err;
    }
  }

  // ==================== ORDER ITEMS ====================

  private async createItems(
    orderId: number,
    storeGroup: any,
    t: Transaction,
  ): Promise<[number, number, OrderItems[]]> {
    const orderItems: OrderItems[] = [];
    let totalAmount = 0;
    let totalQuantity = 0;

    try {
      for (const item of storeGroup.products) {
        const orderedQuantity = this.normalizeOrderQuantity(
          item,
          item.productId
        );
        const product = await this.loadStockProduct(item.productId, t);

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (product.status === false) {
          throw new ServiceUnavailableException(
            `Product "${product.name}" is not available`,
          );
        }

        if (product.unit < orderedQuantity) {
          throw new ServiceUnavailableException(
            `Product "${product.name}" is out of stock`,
          );
        }

        const [updatedProductRows] = await Products.update(
          { unit: literal(`unit - ${orderedQuantity}`) },
          {
            where: {
              _id: product._id,
              unit: {
                [Op.gte]: orderedQuantity,
              },
            },
            transaction: t,
          }
        );
        if (updatedProductRows === 0) {
          throw new ServiceUnavailableException(
            `Product "${product.name}" is out of stock`,
          );
        }

        await product.increment("orderCount", { by: 1, transaction: t });

        const newItem = await OrderItems.create(
          {
            orderId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: orderedQuantity,
            price: product.retail_rate,
            totalPrice: 0,
            image: product.image,
            name: product.name,
            sku: product.sku,
            barcode: product.bar_code,
          } as any,
          { transaction: t },
        );

        if (item.variantId) {
          const variant = await this.loadStockVariant(item.variantId, t);

          if (!variant) {
            throw new NotFoundException(`Variant ${item.variantId} not found`);
          }

          if (variant.productId !== item.productId) {
            throw new ServiceUnavailableException("Variant mismatch");
          }

          if (variant.units < orderedQuantity) {
            throw new ServiceUnavailableException(
              `Variant "${item.variantName}" is out of stock`,
            );
          }

          newItem.price = variant.price;
          newItem.image = variant.image;
          newItem.sku = variant.sku;
          newItem.barcode = variant.barcode;
          newItem.combination = variant.combination;

          const [updatedVariantRows] = await ProductVariant.update(
            { units: literal(`units - ${orderedQuantity}`) },
            {
              where: {
                id: variant.id,
                units: {
                  [Op.gte]: orderedQuantity,
                },
              },
              transaction: t,
            }
          );
          if (updatedVariantRows === 0) {
            throw new ServiceUnavailableException(
              `Variant "${item.variantName}" is out of stock`,
            );
          }
        }

        newItem.totalPrice = newItem.price * newItem.quantity;
        await newItem.save({ transaction: t });

        totalAmount += newItem.totalPrice;
        totalQuantity += newItem.quantity;
        orderItems.push(newItem);
      }

      appLog.info(`✅ Created ${orderItems.length} order items`);
      return [totalQuantity, totalAmount, orderItems];
    } catch (err) {
      throw err;
    }
  }

  // ==================== PAYMENT ====================

  private async createGuestOrderPayment(
    orderId: number,
    grandTotal: number,
    payment: any,
    t: Transaction,
  ) {
    return await OrderPayments.create(
      {
        orderId,
        paymentType: "pay-online",
        status: payment.payment_status === "success" ? "success" : "pending",
        ref: payment.payment_reference,
        amount: grandTotal * 100,
      } as any,
      { transaction: t },
    );
  }

  // ==================== ORDER STATUS ====================

  private async createOrderStatus(
    orderId: number,
    status: string,
    t: Transaction,
  ) {
    return await OrderStatus.create(
      {
        orderId,
        status,
        remark: "Your order is being processed.",
      } as any,
      { transaction: t },
    );
  }

  // ==================== POST-COMMIT ====================

  private async afterCommit(
    data: CreateGuestOrderDto,
    order: any,
    store: Store,
    orderItems: any[],
    guestAddressObject: any,
  ) {
    try {
      appLog.info("📧 Sending notifications...");

      await store.increment("order_count", { by: 1 });

      const guestUser = {
        name: `${data.guest_info.first_name} ${data.guest_info.last_name}`,
        email: data.guest_info.email,
        phone: data.guest_info.phone,
        fcmtoken: null,
      };

      await this.sendGuestOrderConfirmation(
        guestUser,
        order,
        store,
        orderItems,
        guestAddressObject,
      );

      await this.sendSellerNotification(
        guestUser,
        order,
        store,
        orderItems,
        guestAddressObject,
      );

      if (store.fcmtoken) {
        await this.notificationService.sendPushNotification({
          to: store.fcmtoken,
          message: `New order #${order.order_id} from guest customer`,
          title: "New Order Received",
        });
      }
    } catch (err) {
      appLog.error("Failed to send notifications:", err);
    }
  }

  // ==================== EMAILS ====================

  private async sendGuestOrderConfirmation(
    guestUser: any,
    order: any,
    store: Store,
    orderItems: any[],
    address: any,
  ) {
    try {
      const recipientEmail = String(guestUser?.email || "")
        .trim()
        .toLowerCase();

      if (!recipientEmail) {
        throw new BadRequestException(
          "Guest email is missing for order confirmation.",
        );
      }

      const emailData = {
        user: {
          ...guestUser,
          email: recipientEmail,
          name:
            guestUser?.name ||
            `${order?.guest_first_name || ""} ${
              order?.guest_last_name || ""
            }`.trim(),
        },
        newOrder: order,
        store: store,
        address: {
          ...address,
          street: address?.full_address || address?.street || "",
          pin_code: address?.pincode || address?.pin_code || "",
          alt_phone: address?.phone || address?.phone_no || "",
          code: address?.country_code || address?.code || "",
        },
        products: orderItems,
      };

      const userMail = (await ToUserOrderPlaced(emailData)) as {
        to?: string;
        subject?: string;
        template?: string;
      };

      if (!userMail?.template) {
        throw new InternalServerErrorException(
          "Failed to build guest order confirmation email.",
        );
      }

      userMail.to = recipientEmail;
      await this.mailService.sellerEmails(userMail);

      appLog.info("📧 Confirmation sent to:", recipientEmail);
    } catch (err) {
      appLog.error("Failed to send confirmation:", err);
    }
  }

  private async sendSellerNotification(
    guestUser: any,
    order: any,
    store: Store,
    orderItems: any[],
    address: any,
  ) {
    try {
      const emailData = {
        user: guestUser,
        newOrder: order,
        store: store,
        address: address,
        products: orderItems,
      };

      const storeMail = await ToSellerOrderPlaced(emailData);
      await this.mailService.sellerEmails(storeMail);

      appLog.info("📧 Seller notification sent");
    } catch (err) {
      appLog.error("Failed to send seller notification:", err);
    }
  }
}
