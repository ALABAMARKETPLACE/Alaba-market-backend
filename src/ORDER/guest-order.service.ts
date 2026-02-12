// order/guest-order.service.ts

import {
  BadRequestException,
  HttpException,
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
import { getErrorMessage } from "../shared/helpers/errormessage";
import { ToUserOrderPlaced } from "../MAILS/templates/orders/toUser_OrderPlaced";
import { ToSellerOrderPlaced } from "../MAILS/templates/orders/toSeller_OrderPlaced";
import { GetGuestOrdersDto } from "./dto/get-guest-orders.dto";
import { PageOptionsGetOrdersDto } from "./dto/getOrders.dto";

@Injectable()
export class GuestOrderService {
  constructor(
    @InjectModel(Order)
    private readonly orderRepository: typeof Order,
    private readonly paystackService: PaystackService,
    private readonly notificationService: NotificationsService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async createGuestOrder(data: CreateGuestOrderDto) {
    try {
      console.log("=== GUEST ORDER CREATION STARTED ===");
      console.log("Guest Email:", data.guest_info.email);
      console.log("Cart Items:", data.cart_items.length);

      const result = await this.orderRepository.sequelize.transaction(
        async (t) => {
          const newOrders = [];

          // Step 1: Basic validation
          const verified = await this.basicCheck(data);

          // Step 2: Group products by store
          const productsByStore = await this.groupProducts(data.cart_items, t);

          // Step 3: Process each store's order
          for (const storeGroup of productsByStore) {
            // Create order for this store
            const order = await this.placeGuestOrder(
              data,
              storeGroup,
              verified,
              t,
            );

            // Create order items and calculate totals
            const [totalQty, totalAmount, orderItems] = await this.createItems(
              order.id,
              storeGroup,
              t,
            );

            // Get store details
            const store = await Store.findOne({
              where: { id: storeGroup.storeId },
              transaction: t,
            });

            // Calculate delivery date
            const deliveryDate = new Date();
            deliveryDate.setDate(
              deliveryDate.getDate() + (store?.delivery_period ?? 2),
            );
            deliveryDate.setMinutes(
              deliveryDate.getMinutes() + (store?.delivery_period_minutes ?? 0),
            );

            // Update order with calculated values
            order.delivery_date = deliveryDate;
            order.totalItems = totalQty;
            order.total = totalAmount;
            order.grandTotal =
              totalAmount + order.deliveryCharge - order.discount;

            // ✅ Build guest address object for compatibility with existing email templates
            const guestAddressObject = {
              full_name: data.delivery_address.full_name,
              phone_no: data.delivery_address.phone_no,
              full_address: data.delivery_address.full_address,
              city: data.delivery_address.city,
              state: data.delivery_address.state,
              country: data.delivery_address.country,
              landmark: data.delivery_address.landmark || "",
              address_type: data.delivery_address.address_type || "Home",
            };

            order.address = guestAddressObject as any; // Store as JSON for email templates

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

            newOrders.push({
              newOrder: order,
              orderPayment: payment,
              orderStatus: orderStatus,
              orderItems: orderItems,
              address: guestAddressObject, // Included for email templates
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

      return new DataResponseDto(
        result,
        true,
        "Order placed successfully! Check your email for confirmation.",
      );
    } catch (err) {
      console.error("=== GUEST ORDER CREATION FAILED ===");
      console.error("Error:", err.message);
      console.error("Stack:", err.stack);

      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        `Failed to create order: ${getErrorMessage(err)}`,
      );
    }
  }
   
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

      // ✅ Only add order_id if it exists and is not empty
      if (data.order_id && data.order_id.trim() !== "") {
        whereClause.order_id = data.order_id.trim();
        console.log("Filtering by Order ID:", data.order_id.trim());
      }

      // Add status filter if provided
      if (pageOptions.status) {
        whereClause.status = pageOptions.status;
      }

      // Calculate pagination
      const limit = pageOptions.take || 10;
      const offset = ((pageOptions.page || 1) - 1) * limit;

      // Fetch orders with related data
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
                "business_location",
                "logo_upload",
                "slug",
                "averageRating",
                "ratings",
                "description",
              ],
            },
          ],
          limit,
          offset,
          order: [["createdAt", "DESC"]],
          distinct: true,
        });

      // ✅ IMPROVED: Better response for no orders found
      if (orders.length === 0) {
        // If searching for specific order_id, throw 404
        if (data.order_id && data.order_id.trim() !== "") {
          throw new NotFoundException(
            `Order "${data.order_id}" not found for email ${data.email}`,
          );
        }

        // If just listing all orders, return empty array with 200
        const message = "No orders found for this email address";
        console.log(`ℹ️ ${message}`);

        return new DataResponseDto([], true, message, pageOptions, 0);
      }

      // Format response
      const formattedOrders = orders.map((order: any) => ({
        id: order.id,
        order_id: order.order_id,
        status: order.status,

        // Guest info
        guest_email: order.guest_email,
        guest_first_name: order.guest_first_name,
        guest_last_name: order.guest_last_name,
        guest_phone: order.guest_phone,

        // Delivery address
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

        // Store info
        store: {
          id: order.storeDetails?.id,
          name: order.storeDetails?.store_name || order.storeDetails?.name,
          email: order.storeDetails?.email,
          phone: order.storeDetails?.phone,
          address: order.storeDetails?.business_address,
          location: order.storeDetails?.business_location,
          logo: order.storeDetails?.logo_upload,
          slug: order.storeDetails?.slug,
          rating: order.storeDetails?.averageRating,
          totalRatings: order.storeDetails?.ratings,
          description: order.storeDetails?.description,
        },

        // Order details
        items: order.orderItems,
        totalItems: order.totalItems,
        total: order.total,
        deliveryCharge: order.deliveryCharge,
        discount: order.discount,
        tax: order.tax,
        grandTotal: order.grandTotal,

        // Payment
        payment: order.orderPayment,
        paymentType: order.paymentType,

        // Dates
        delivery_date: order.delivery_date,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,

        // Status history
        orderStatus: order.orderStatus,

        // Notes
        order_notes: order.order_notes,
      }));

      console.log(`✅ Found ${count} guest order(s)`);

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
      console.error("Stack:", err.stack);

      // ✅ Pass through HTTP exceptions (like NotFoundException)
      if (err instanceof HttpException) throw err;

      // ✅ IMPROVED: Better error handling for database errors
      if (err.message?.includes("invalid input syntax")) {
        throw new BadRequestException(
          "Invalid order ID format. Please provide a valid order ID like 'ORD-123456'.",
        );
      }

      if (err.message?.includes("does not exist")) {
        throw new InternalServerErrorException(
          "Database configuration error. Please contact support.",
        );
      }

      // Generic error
      throw new InternalServerErrorException("Failed to retrieve orders");
    }
  }

  // ==================== VALIDATION ====================

  private async basicCheck(data: CreateGuestOrderDto) {
    try {
      console.log("🔍 [basicCheck] Starting guest order validation...");

      // 1. Validate cart items
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
      if (data.payment.payment_status !== "success") {
        throw new BadRequestException("Payment not successful");
      }

      if (!data.payment.payment_reference) {
        throw new BadRequestException("Payment reference is required");
      }

      // 5. Verify delivery token
      console.log("🔍 [basicCheck] Verifying delivery token...");
      const verified: any = this.jwtService.decode(
        data.delivery.delivery_token,
      );

      if (!verified || isNaN(Number(verified?.data?.amount))) {
        throw new BadRequestException("Invalid delivery token");
      }

      // 6. Check if token has expired
      const now = Math.floor(Date.now() / 1000);
      if (verified.exp && verified.exp < now) {
        throw new BadRequestException(
          "Delivery token has expired. Please recalculate delivery.",
        );
      }

      console.log("✅ [basicCheck] Validation passed!");
      return verified;
    } catch (err) {
      console.error("❌ [basicCheck] Error:", err.message);
      throw err;
    }
  }

  // ==================== GROUPING ====================

  private async groupProducts(cartItems: any[], transaction: Transaction) {
    try {
      const grouped = new Map();

      for (const item of cartItems) {
        // Verify product exists and get store_id
        const product = await Products.findOne({
          attributes: ["store_id", "_id", "status"],
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
            `Product "${item.product_name}" is not available`,
          );
        }

        const storeId = product.store_id;

        if (!grouped.has(storeId)) {
          grouped.set(storeId, {
            storeId,
            products: [],
          });
        }

        grouped.get(storeId).products.push({
          id: item.product_id,
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity,
          productName: item.product_name,
          variantName: item.variant_name,
          weight: item.weight,
        });
      }

      console.log(`📦 Products grouped into ${grouped.size} store(s)`);
      return Array.from(grouped.values());
    } catch (err) {
      throw err;
    }
  }

  // ==================== ORDER CREATION ====================

  private async placeGuestOrder(
    data: CreateGuestOrderDto,
    storeGroup: any,
    verified: any,
    transaction: Transaction,
  ) {
    try {
      // Calculate store-specific delivery charge
      let storeDeliveryCharge = 0;
      if (Array.isArray(verified?.data?.deliveryCharges)) {
        storeDeliveryCharge =
          verified?.data?.deliveryCharges?.find(
            (item: any) => item?.storeId === storeGroup.storeId,
          )?.totalCharge ?? 0;
      } else {
        storeDeliveryCharge = verified?.data?.amount ?? 0;
      }

      // Calculate store-specific discount
      let storeDiscount = 0;
      if (Array.isArray(verified?.data?.discount)) {
        storeDiscount =
          verified?.data?.discount?.find(
            (item: any) => item?.storeId === storeGroup.storeId,
          )?.discount ?? 0;
      } else {
        storeDiscount = verified?.data?.discount ?? 0;
      }

      const newOrder = await Order.create(
        {
          // ✅ User info - NULL for guest orders (MUST be null, not undefined)
          userId: null,
          addressId: null,

          // ✅ Guest identification
          is_guest_order: true,
          guest_email: data.guest_info.email,
          guest_first_name: data.guest_info.first_name,
          guest_last_name: data.guest_info.last_name,
          guest_phone: data.guest_info.phone,
          guest_country_code: data.guest_info.country_code,

          // ✅ Delivery address (inline fields)
          delivery_full_name: data.delivery_address.full_name,
          delivery_phone: data.delivery_address.phone_no,
          delivery_address: data.delivery_address.full_address,
          delivery_city: data.delivery_address.city,
          delivery_state: data.delivery_address.state,
          delivery_state_id: data.delivery_address.state_id,
          delivery_country: data.delivery_address.country,
          delivery_country_id: data.delivery_address.country_id,
          delivery_landmark: data.delivery_address.landmark || null,
          delivery_address_type: data.delivery_address.address_type || "Home",

          // ✅ Store info
          storeId: storeGroup.storeId,

          // ✅ Payment info
          paymentType: "pay-online",
          payment_reference: data.payment.payment_reference,
          transaction_reference: data.payment.transaction_reference,

          // ✅ Charges
          tax: verified?.data?.tax ?? 0,
          deliveryCharge: storeDeliveryCharge,
          discount: storeDiscount,

          // ✅ Metadata
          order_notes: data.metadata?.order_notes || null,
          preferred_delivery_time:
            data.metadata?.preferred_delivery_time || null,
          order_source: data.metadata?.source || "web",
          device_id: data.metadata?.device_id || null,

          // ✅ Status
          status: "pending",
        },
        { transaction },
      );

      console.log(
        `✅ Created guest order ID: ${newOrder.id}, Order #${newOrder.order_id}`,
      );
      return newOrder;
    } catch (err) {
      console.error("❌ Failed to create guest order:", err);
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
        // Get product details
        const product = await Products.findOne({
          where: { _id: item.productId },
          transaction: t,
        });

        if (!product) {
          throw new NotFoundException(`Product ID ${item.productId} not found`);
        }

        if (product.status === false) {
          throw new ServiceUnavailableException(
            `Product "${item.productName}" is not available`,
          );
        }

        if (product.store_id !== storeGroup.storeId) {
          throw new ServiceUnavailableException(
            `Product "${item.productName}" is not available in this store`,
          );
        }

        if (product.unit === 0 || product.unit < item.quantity) {
          throw new ServiceUnavailableException(
            `Product "${item.productName}" is out of stock`,
          );
        }

        // Decrement stock
        await product.decrement("unit", {
          by: Number(item.quantity),
          transaction: t,
        });

        // Increment order count
        await product.increment("orderCount", { by: 1, transaction: t });

        // Create order item
        const newItem = await OrderItems.create(
          {
            orderId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: product.retail_rate,
            totalPrice: 0, // Will be calculated below
            image: product.image,
            name: product.name,
            sku: product.sku,
            barcode: product.bar_code,
          },
          { transaction: t },
        );

        // Handle variant if present
        if (item.variantId) {
          const variant = await ProductVariant.findOne({
            where: { id: item.variantId },
            transaction: t,
          });

          if (!variant) {
            throw new NotFoundException(
              `Variant not available for "${item.productName}"`,
            );
          }

          if (variant.productId !== item.productId) {
            throw new ServiceUnavailableException(
              `Variant mismatch for "${item.productName}"`,
            );
          }

          if (variant.units === 0 || variant.units < item.quantity) {
            throw new ServiceUnavailableException(
              `Variant for "${item.productName}" is out of stock`,
            );
          }

          // Update item with variant details
          newItem.price = variant.price;
          newItem.image = variant.image;
          newItem.sku = variant.sku;
          newItem.barcode = variant.barcode;
          newItem.combination = variant.combination;

          // Decrement variant stock
          await variant.decrement("units", {
            by: Number(item.quantity),
            transaction: t,
          });
        }

        // Calculate total price
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
        // transaction_reference: payment.transaction_reference,
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

  // ==================== POST-COMMIT ACTIONS ====================

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

        // Increment store order count
        await store.increment("order_count", { by: 1 });

        // ✅ Create guest user object (mimics User entity for email templates)
        const guestUser = {
          name: `${data.guest_info.first_name} ${data.guest_info.last_name}`,
          email: data.guest_info.email,
          phone: data.guest_info.phone,
          fcmtoken: null, // Guest users don't have FCM tokens
        };

        // Send email to guest (reusing existing template)
        await this.sendGuestOrderConfirmation(
          guestUser,
          order,
          store,
          orderItems,
          guestAddressObject,
        );

        // Notify seller via push notification
        if (store.fcmtoken) {
          await this.notificationService.sendPushNotification({
            to: store.fcmtoken,
            message: `You have received a new order #${order.order_id} from guest customer`,
            title: "You have a new Order",
          });
        }

        // Send email to seller (reusing existing template)
        await this.sendSellerNotification(
          guestUser,
          order,
          store,
          orderItems,
          guestAddressObject,
        );

        console.log("✅ Notifications sent successfully");
      });
    } catch (err) {
      console.error("Failed to send notifications:", err);
      // Don't throw - order was created successfully
    }
  }

  // ==================== EMAIL NOTIFICATIONS ====================

  private async sendGuestOrderConfirmation(
    guestUser: any,
    order: any,
    store: Store,
    orderItems: any[],
    address: any,
  ) {
    try {
      // ✅ Reuse existing email template (same as authenticated users)
      const emailData = {
        user: guestUser,
        newOrder: order,
        store: store,
        address: address,
        products: orderItems,
      };

      const userMail = await ToUserOrderPlaced(emailData);
      await this.mailService.sellerEmails(userMail);

      console.log("📧 Order confirmation sent to:", guestUser.email);
    } catch (err) {
      console.error("Failed to send guest confirmation email:", err);
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
      // ✅ Reuse existing seller email template
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
