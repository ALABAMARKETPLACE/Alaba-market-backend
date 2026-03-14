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
import { Transaction } from "sequelize";

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
import { GetGuestOrdersDto } from "./dto/get-guest-orders.dto";
import { PageOptionsGetOrdersDto } from "./dto/getOrders.dto";

type GuestOrderCreationOptions = {
  skipPaymentVerification?: boolean;
  verifiedPaymentData?: any;
};

@Injectable()
export class GuestOrderService {
  constructor(
    @InjectModel(Order)
    private readonly orderRepository: typeof Order,
    @Inject(forwardRef(() => PaystackService))
    private readonly paystackService: PaystackService,
    private readonly notificationService: NotificationsService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  // ==================== MAIN ORDER CREATION ====================

  async createGuestOrder(
    data: CreateGuestOrderDto,
    options: GuestOrderCreationOptions = {},
  ) {
    try {
      console.log("=== GUEST ORDER CREATION STARTED ===");
      console.log("Guest Email:", data.guest_info.email);
      console.log("Cart Items:", data.cart_items.length);
      console.log("Payment Reference:", data.payment.payment_reference);

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

      console.log(
        `📦 Multi-seller: ${isMultiSeller} (${storeIds.size} stores)`,
      );

      const result = await this.orderRepository.sequelize.transaction(
        async (t) => {
          const newOrders = [];

          // ✅ Step 1: Validate delivery token and basic data
          const verified = await this.basicCheck(data);

          // ✅ Step 2: Verify payment with Paystack (CRITICAL)
          if (data.payment.payment_reference) {
            const expectedAmountInKobo =
              this.getExpectedGuestPaymentAmountInKobo(data, verified);

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

            // Schedule post-commit actions
            await this.afterCommit(
              t,
              data,
              order,
              store,
              orderItems,
              guestAddressObject,
            );
          }

          return newOrders;
        },
      );

      console.log("=== GUEST ORDER CREATED SUCCESSFULLY ===");
      console.log("Total Orders:", result.length);

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
      console.error("=== GUEST ORDER CREATION FAILED ===");
      console.error("Error:", err.message);
      console.error("Stack:", err.stack);

      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        `Order creation failed: ${err.message}`,
      );
    }
  }

  // ==================== GET GUEST ORDERS ====================

  async getGuestOrders(
    data: GetGuestOrdersDto,
    pageOptions: PageOptionsGetOrdersDto,
  ): Promise<DataResponseDto> {
    try {
      console.log("=== FETCHING GUEST ORDERS ===");
      console.log("Guest Email:", data.email);

      // Build where clause
      const whereClause: any = {
        is_guest_order: true,
        guest_email: data.email.toLowerCase().trim(),
      };

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
      const formattedOrders = orders.map((order: any) => ({
        id: order.id,
        order_id: order.order_id,
        status: order.status,
        guest_email: order.guest_email,
        guest_first_name: order.guest_first_name,
        guest_last_name: order.guest_last_name,
        guest_phone: order.guest_phone,
        delivery_address: {
          full_name: order.delivery_full_name,
          phone: order.delivery_phone,
          address: order.delivery_address,
          city: order.delivery_city,
          state: order.delivery_state,
          country: order.delivery_country,
          landmark: order.delivery_landmark,
          address_type: order.delivery_address_type,
        },
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
      }));

      return new DataResponseDto(
        formattedOrders,
        true,
        "Orders retrieved successfully",
        pageOptions,
        count,
      );
    } catch (err) {
      console.error("=== FAILED TO FETCH GUEST ORDERS ===");
      console.error("Error:", err.message);

      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException("Failed to retrieve orders");
    }
  }

  // ==================== VALIDATION ====================

  private async basicCheck(data: CreateGuestOrderDto) {
    try {
      console.log("🔍 [basicCheck] Starting validation...");

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
      console.log("🔍 [basicCheck] Verifying delivery token...");
      const verified: any = await this.jwtService.verifyAsync(
        data.delivery.delivery_token,
      );

      if (!verified || !verified?.data) {
        throw new BadRequestException("Invalid delivery token");
      }

      if (
        verified?.data?.isGuest != null &&
        verified.data.isGuest !== true
      ) {
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
      const now = Math.floor(Date.now() / 1000);
      if (verified.exp && verified.exp < now) {
        throw new BadRequestException(
          "Delivery token expired. Please recalculate delivery.",
        );
      }

      console.log("✅ [basicCheck] Validation passed!");
      return verified;
    } catch (err) {
      console.error("❌ [basicCheck] Error:", err.message);
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
      console.log("🔍 Verifying payment:", paymentReference);

      const paystackResponse: any = await this.paystackService.verifyPayment({
        reference: paymentReference,
      });
      this.assertVerifiedPaymentData(
        paystackResponse.data,
        paymentReference,
        expectedAmountInKobo,
        guestEmail,
      );

      console.log("✅ Payment verified successfully");
    } catch (err) {
      console.error("❌ Payment verification failed:", err.message);
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
    if (
      expectedAmountInKobo != null &&
      amountInKobo !== expectedAmountInKobo
    ) {
      console.warn(
        `⚠️  Amount mismatch: Expected ${
          expectedAmountInKobo / 100
        }, got ${amountInKobo / 100}`,
      );
      throw new BadRequestException("Payment amount does not match order total.");
    }
  }

  // ==================== GROUPING ====================

  private async groupProducts(cartItems: any[], transaction: Transaction) {
    try {
      const grouped = new Map();

      for (const item of cartItems) {
        // Verify product exists
        const product = await Products.findOne({
          attributes: ["_id", "store_id", "status", "name"],
          where: { _id: item.product_id },
          transaction,
        });

        if (!product) {
          throw new NotFoundException(
            `Product ID ${item.product_id} not found`,
          );
        }

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
          productId: item.product_id,
          variantId: item.variant_id || null,
          quantity: item.quantity,
          productName: item.product_name,
          variantName: item.variant_name,
          weight: item.weight,
        });
      }

      console.log(`📦 Grouped into ${grouped.size} store(s)`);
      return Array.from(grouped.values());
    } catch (err) {
      throw err;
    }
  }

  private getExpectedGuestPaymentAmountInKobo(
    data: CreateGuestOrderDto,
    verified: any,
  ): number | null {
    const orderSummaryTotal = Number(data.order_summary?.total);
    if (Number.isFinite(orderSummaryTotal) && orderSummaryTotal > 0) {
      return Math.round(orderSummaryTotal * 100);
    }

    const canCalculateSubtotal = data.cart_items.every((item) => {
      const hasTotalPrice =
        Number.isFinite(Number(item.total_price)) &&
        Number(item.total_price) >= 0;
      const hasUnitPrice =
        Number.isFinite(Number(item.unit_price)) &&
        Number.isFinite(Number(item.quantity));

      return hasTotalPrice || hasUnitPrice;
    });

    if (!canCalculateSubtotal) {
      return null;
    }

    const subtotal = data.cart_items.reduce((sum, item) => {
      const itemTotal = Number(item.total_price);
      if (Number.isFinite(itemTotal) && itemTotal >= 0) {
        return sum + itemTotal;
      }

      const unitPrice = Number(item.unit_price);
      const quantity = Number(item.quantity);
      if (Number.isFinite(unitPrice) && Number.isFinite(quantity)) {
        return sum + unitPrice * quantity;
      }

      return sum;
    }, 0);

    const tax = Number(verified?.data?.tax ?? data.order_summary?.tax ?? 0);
    const discount = this.getDiscountAmount(
      verified?.data?.discount ?? data.order_summary?.discount,
    );
    const total = subtotal + tax - discount;

    return total > 0 ? Math.round(total * 100) : null;
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
        },
        { transaction },
      );

      console.log(
        `✅ Created order #${newOrder.order_id} for store ${storeGroup.storeId}`,
      );
      return newOrder;
    } catch (err) {
      console.error("❌ Failed to create order:", err);
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
        const product = await Products.findOne({
          where: { _id: item.productId },
          transaction: t,
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (product.status === false) {
          throw new ServiceUnavailableException(
            `Product "${product.name}" is not available`,
          );
        }

        if (product.unit === 0 || product.unit < item.quantity) {
          throw new ServiceUnavailableException(
            `Product "${product.name}" is out of stock`,
          );
        }

        await product.decrement("unit", {
          by: Number(item.quantity),
          transaction: t,
        });

        await product.increment("orderCount", { by: 1, transaction: t });

        const newItem = await OrderItems.create(
          {
            orderId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: product.retail_rate,
            totalPrice: 0,
            image: product.image,
            name: product.name,
            sku: product.sku,
            barcode: product.bar_code,
          },
          { transaction: t },
        );

        if (item.variantId) {
          const variant = await ProductVariant.findOne({
            where: { id: item.variantId },
            transaction: t,
          });

          if (!variant) {
            throw new NotFoundException(`Variant ${item.variantId} not found`);
          }

          if (variant.productId !== item.productId) {
            throw new ServiceUnavailableException("Variant mismatch");
          }

          if (variant.units === 0 || variant.units < item.quantity) {
            throw new ServiceUnavailableException(
              `Variant "${item.variantName}" is out of stock`,
            );
          }

          newItem.price = variant.price;
          newItem.image = variant.image;
          newItem.sku = variant.sku;
          newItem.barcode = variant.barcode;
          newItem.combination = variant.combination;

          await variant.decrement("units", {
            by: Number(item.quantity),
            transaction: t,
          });
        }

        newItem.totalPrice = newItem.price * newItem.quantity;
        await newItem.save({ transaction: t });

        totalAmount += newItem.totalPrice;
        totalQuantity += newItem.quantity;
        orderItems.push(newItem);
      }

      console.log(`✅ Created ${orderItems.length} order items`);
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
      },
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
      },
      { transaction: t },
    );
  }

  // ==================== POST-COMMIT ====================

  private async afterCommit(
    t: Transaction,
    data: CreateGuestOrderDto,
    order: any,
    store: Store,
    orderItems: any[],
    guestAddressObject: any,
  ) {
    try {
      t.afterCommit(async () => {
        console.log("📧 Sending notifications...");

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

        console.log("✅ Notifications sent");
      });
    } catch (err) {
      console.error("Failed to send notifications:", err);
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
      const emailData = {
        user: guestUser,
        newOrder: order,
        store: store,
        address: address,
        products: orderItems,
      };

      const userMail = await ToUserOrderPlaced(emailData);
      await this.mailService.sellerEmails(userMail);

      console.log("📧 Confirmation sent to:", guestUser.email);
    } catch (err) {
      console.error("Failed to send confirmation:", err);
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

      console.log("📧 Seller notification sent");
    } catch (err) {
      console.error("Failed to send seller notification:", err);
    }
  }
}
