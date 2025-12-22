import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { CreateOrderDto } from "./dto/createOrder.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Products } from "../PRODUCTS/products.entity";
import {
  OrderItemsType,
  OrderItems as orderItemss,
  paymentType,
  AddressType,
  Charges,
} from "./dto/order_types.dto";
import { ToUserOrderPlaced } from "../MAILS/templates/orders/toUser_OrderPlaced";
import { ToSellerOrderPlaced } from "../MAILS/templates/orders/toSeller_OrderPlaced";
import { Order } from "./order.entity";
import { Sequelize, Transaction } from "sequelize";
import { OrderItems } from "../ORDER_ITEMS/order_items.entity";
import { PaymentGateWayService } from "../PAYMENT_GATEWAY/payment_gateway.service";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { NewAddress } from "../NEW_ADDRESS/newaddress.entity";
import { Store } from "../STORE/store.entity";
import { CartServices } from "../CART/cart.services";
import { NotificationsService } from "../NOTIFICATIONS/notification.service";
import { MailService } from "../MAILS/Mails.services";
import { OrderLogService } from "./order.log";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { JwtService } from "@nestjs/jwt";
import { PaystackService } from "../PAYSTACK_PAYMENT/paystack.service";

@Injectable()
export class OrderPlaceService {
  constructor(
    @Inject("SEQUELIZE") private readonly sequelize: Sequelize,
    private readonly paymentGatewayService: PaymentGateWayService,
    private readonly paystackService: PaystackService,
    private readonly cartService: CartServices,
    private readonly notificationService: NotificationsService,
    private readonly mailService: MailService,
    private readonly orderLogService: OrderLogService,
    private readonly jwtService: JwtService
  ) {}

  async create(userId: number, data: CreateOrderDto) {
    try {
      const result = await this.sequelize.transaction(async (t) => {
        const newOrders = [];
        const verified = await this.basicCheck(data);

        const products = await this.groupProducts(data.cart, t);
        const address = await this.orderAddress(userId, data.address, t);
        for (const item of products) {
          const order = await this.placeOrder(userId, data, item, verified, t);
          const [qnty, total, itms] = await this.createItems(order.id, item, t);
          const store = await Store.findOne({
            where: { id: item.storeId },
            transaction: t,
          });
          //================
          const deliveryDate = new Date();
          deliveryDate.setDate(
            deliveryDate.getDate() + (store?.delivery_period ?? 2)
          );
          deliveryDate.setMinutes(
            deliveryDate.getMinutes() + (store?.delivery_period_minutes ?? 0)
          );
          order.delivery_date = deliveryDate;
          order.totalItems = qnty;
          order.total = total;
          order.grandTotal = total; //inside modal
          order.address = address;
          await order.save({ transaction: t });
          const payment = await this.orderPayment(
            order.id,
            order.grandTotal,
            data.payment,
            t
          );
          const orderStatus = await this.orderStatus(order.id, order.status, t);
          newOrders.push({
            newOrder: order,
            orderPayment: payment,
            orderStatus: orderStatus,
            orderItems: itms,
            address: address,
          });
          await this.afterCommit(t, data, order, store, itms, address);
        }
        return newOrders;
      });
      return new DataResponseDto(result);
    } catch (err) {
      console.log(err);
      try {
        return await this.orderLogService.create(
          userId,
          data,
          err instanceof HttpException == true
            ? err.message
            : getErrorMessage(err)
        );
      } catch (err) {
        if (err instanceof HttpException) throw err;
        throw new InternalServerErrorException();
      }
    }
  }

  async groupProducts(
    data: any[],
    transaction: Transaction
  ): Promise<orderItemss[]> {
    try {
      const items: orderItemss[] = await data.reduce(
        async (accPromise, item) => {
          const acc = await accPromise;
          //index only scan on products._id and store_id
          const storeId = await Products.findOne({
            attributes: ["store_id"],
            where: { _id: item?.productId },
            transaction,
          });
          if (!storeId) throw new NotFoundException("Product Not found.");
          const obj: OrderItemsType = {
            id: item?.id,
            productId: item?.productId,
            quantity: item?.quantity,
            variantId: item?.variantId,
          };
          const exist = acc.find(
            (store: any) => store?.storeId == storeId?.store_id
          );
          if (exist) {
            exist?.products?.push(obj);
          } else {
            acc.push({
              storeId: storeId?.store_id,
              products: [obj],
            });
          }
          return acc;
        },
        Promise.resolve([])
      );
      return items;
    } catch (err) {
      throw err;
    }
  }
  async basicCheck(data: CreateOrderDto) {
    try {
      console.log("🔍 [basicCheck] Starting order validation...");

      if (Array.isArray(data.cart) == false || data?.cart?.length == 0)
        throw new BadRequestException("No Products Selected");

      //===================
      console.log("🔍 [basicCheck] Decoding delivery charge token...");
      const verified = this.jwtService.decode(data?.charges?.token);
      console.log("✅ [basicCheck] Decoded token:", verified);

      if (!verified || isNaN(verified?.data?.amount))
        throw new BadRequestException("Failed to Calculate Delivery charge.");

      //=====================
      console.log("🔍 [basicCheck] Comparing address IDs:");
      console.log(
        "   - Token addressId:",
        verified?.data?.addressId,
        "(type:",
        typeof verified?.data?.addressId,
        ")"
      );
      console.log(
        "   - Request address.id:",
        data?.address?.id,
        "(type:",
        typeof data?.address?.id,
        ")"
      );

      // Convert both to numbers for comparison
      const tokenAddressId = Number(verified?.data?.addressId);
      const requestAddressId = Number(data?.address?.id);

      console.log(
        "   - After conversion:",
        tokenAddressId,
        "vs",
        requestAddressId
      );

      if (tokenAddressId !== requestAddressId)
        throw new ServiceUnavailableException("Invalid Address Found.");

      console.log("✅ [basicCheck] Address validation passed!");
      return verified;
    } catch (err) {
      console.error("❌ [basicCheck] Error:", err.message);
      throw err;
    }
  }
  // async placeOrder(
  //   userId: number,
  //   data: CreateOrderDto,
  //   product: orderItemss,
  //   verified: any,
  //   transaction: Transaction
  // ) {
  //   try {
  //     const newOrder = await Order.create(
  //       {
  //         userId,
  //         addressId: data.address?.id,
  //         storeId: product.storeId,
  //         paymentType: data.payment?.ref
  //           ? "pay online"
  //           : data?.payment?.type == "Pay On Credit"
  //           ? "pay-on-credit"
  //           : "cash-on-delivery",
  //         tax: verified?.data?.tax ?? 0,
  //         deliveryCharge: verified?.data?.amount,
  //         discount: verified?.data?.discount ?? 0,
  //       },
  //       { transaction }
  //     );
  //     return newOrder;
  //   } catch (err) {
  //     throw err;
  //   }
  // }

  async placeOrder(
    userId: number,
    data: CreateOrderDto,
    product: orderItemss,
    verified: any,
    transaction: Transaction
  ) {
    try {
      // Handle both array and single value discount structures
      let storeDiscount = 0;
      if (Array.isArray(verified?.data?.discount)) {
        storeDiscount =
          verified?.data?.discount?.find(
            (item: any) => item?.storeId === product?.storeId
          )?.discount ?? 0;
      } else {
        storeDiscount = verified?.data?.discount ?? 0;
      }

      // Handle both array and single value delivery charge structures
      let storeDeliveryCharge = 0;
      if (Array.isArray(verified?.data?.deliveryCharges)) {
        storeDeliveryCharge =
          verified?.data?.deliveryCharges?.find(
            (item: any) => item?.storeId === product?.storeId
          )?.totalCharge ?? 0;
      } else {
        storeDeliveryCharge = verified?.data?.amount ?? 0;
      }

      // Generate pickup code (6-digit random number)
      const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Generate order OTP (6-digit random number) for delivery verification
      const orderOtp = Math.floor(100000 + Math.random() * 900000).toString();

      const newOrder = await Order.create(
        {
          userId,
          addressId: data.address?.id,
          storeId: product?.storeId,
          paymentType: data.payment?.ref
            ? "pay online"
            : data?.payment?.type == "Pay On Credit"
            ? "pay-on-credit"
            : "cash-on-delivery",
          tax: verified?.data?.tax ?? 0,
          deliveryCharge: storeDeliveryCharge,
          discount: storeDiscount,
          pickup_code: pickupCode,
          order_otp: orderOtp,
        },
        { transaction }
      );
      return newOrder;
    } catch (err) {
      throw err;
    }
  }
  async createItems(
    orderId: number,
    items: orderItemss,
    t: Transaction
  ): Promise<[number, number, OrderItems[]]> {
    const orderItems: OrderItems[] = [];
    let total = 0;
    let quantity = 0;
    try {
      for (const item of items?.products) {
        const product = await Products.findOne({
          where: { _id: item?.productId },
          transaction: t,
        });
        if (!product) throw new NotFoundException("Product not found.");
        if (product.status == false)
          throw new ServiceUnavailableException("Product is Not Available");
        if (product.store_id != items.storeId)
          throw new ServiceUnavailableException(
            "Product is Not Available on this store."
          );
        if (product.unit == 0 || product.unit < item?.quantity)
          throw new ServiceUnavailableException("Product out of stock");
        await product.decrement("unit", {
          by: Number(item?.quantity),
          transaction: t,
        });
        await product.increment("orderCount", { by: 1, transaction: t });
        //============================================================================================
        const newItem = await OrderItems.create(
          {
            orderId,
            productId: item?.productId,
            variantId: item?.variantId,
            quantity: item?.quantity,
            price: product.retail_rate,
            totalPrice: 0, //inside modal,
            image: product.image,
            name: product.name,
            sku: product.sku,
            barcode: product.bar_code,
          },
          { transaction: t }
        );
        //===========================================================================
        if (item?.variantId) {
          const variant = await ProductVariant.findOne({
            where: { id: item?.variantId },
            transaction: t,
          });
          if (!variant) throw new NotFoundException("Variant is Not Available");
          if (variant.productId != item?.productId)
            throw new ServiceUnavailableException("Variant is Not Available");
          if (variant.units == 0 || variant.units < item?.quantity)
            throw new ServiceUnavailableException("Variant is out of stock");
          newItem.price = variant.price;
          newItem.totalPrice = 0; //inside modal
          newItem.image = variant.image;
          newItem.sku = variant.sku;
          newItem.barcode = variant.barcode;
          newItem.combination = variant.combination;
          await newItem.save({ transaction: t });
          await variant.decrement("units", {
            by: Number(item?.quantity),
            transaction: t,
          });
        }
        total += newItem.totalPrice;
        quantity += newItem.quantity;
        orderItems.push(newItem);
      }
      return [quantity, total, orderItems];
    } catch (err) {
      throw err;
    }
  }
  private isPaystackPayment(paymentRef: string): boolean {
    if (!paymentRef) return false;
    // Paystack references typically start with specific patterns
    // You can adjust this logic based on your reference patterns
    return (
      paymentRef.startsWith("ps_") ||
      paymentRef.startsWith("paystack_") ||
      (paymentRef.length > 10 && !paymentRef.includes("_embedded"))
    );
  }

  private async verifyPaymentWithGateway(
    paymentRef: string,
    grandTotal: number
  ) {
    if (this.isPaystackPayment(paymentRef)) {
      // Verify with Paystack
      const paystackResponse: any = await this.paystackService.verifyPayment({
        reference: paymentRef,
      });

      if (
        paystackResponse.status &&
        paystackResponse.data?.data?.status === "success"
      ) {
        const amountInKobo = paystackResponse.data?.data?.amount; // Paystack amount is in kobo
        const expectedAmountInKobo = grandTotal * 100;

        return {
          verified: true,
          status:
            amountInKobo === expectedAmountInKobo ? "success" : "incomplete",
          amount: amountInKobo,
          currency: paystackResponse.data.currency,
          email: paystackResponse.data.customer?.email,
          gateway: "paystack",
        };
      } else {
        return {
          verified: false,
          status: "failed",
          amount: grandTotal * 100,
          currency: "NGN",
          email: null,
          gateway: "paystack",
        };
      }
    }
    // else {
    //   // Verify with Network International
    //   const niResponse = await this.paymentGatewayService.getOrderDetails(
    //     paymentRef
    //   );

    //   if (niResponse?._embedded?.payment[0]?.state === "CAPTURED") {
    //     const amount = niResponse.amount?.value;
    //     const expectedAmount = grandTotal * 100;

    //     return {
    //       verified: true,
    //       status: amount === expectedAmount ? "success" : "incomplete",
    //       amount: amount,
    //       currency: niResponse.amount?.currencyCode,
    //       email: niResponse.emailAddress,
    //       gateway: "network_international",
    //     };
    //   } else {
    //     return {
    //       verified: false,
    //       status: "failedd",
    //       amount: grandTotal * 100,
    //       currency: "USD",
    //       email: null,
    //       gateway: "network_international",
    //     };
    //   }
    // }
  }

  async orderPayment(
    orderId: number,
    grandTotal: number,
    payment: paymentType,
    t: Transaction
  ) {
    try {
      let paymentStatus = "pending";
      let paymentInfo: any = null;

      if (payment?.ref) {
        try {
          paymentInfo = await this.verifyPaymentWithGateway(
            payment.ref,
            grandTotal
          );

          if (paymentInfo.verified) {
            paymentStatus = paymentInfo.status;
          } else {
            throw new NotAcceptableException("Payment is Failed.");
          }
        } catch (verifyError) {
          console.error("Payment verification error:", verifyError);
          throw new NotAcceptableException("Payment is Failed.");
        }
      } else {
        paymentStatus = "pending";
      }

      const newPayment = await OrderPayments.create(
        {
          orderId,
          paymentType: payment?.ref
            ? "pay-online"
            : payment?.type == "Pay On Credit"
            ? "pay-on-credit"
            : "cash-on-delivery",
          status: paymentStatus,
          ref: payment?.ref,
          currency: paymentInfo?.currency,
          amount: paymentInfo?.amount ?? grandTotal * 100,
          cardHolder: paymentInfo?.email,
        },
        { transaction: t }
      );
      return newPayment;
    } catch (err) {
      throw err;
    }
  }
  async orderStatus(orderId: number, status: string, t: Transaction) {
    try {
      const orderStatus = await OrderStatus.create(
        {
          orderId,
          status,
          remark: "your order is getting processed.",
        },
        { transaction: t }
      );
      return orderStatus;
    } catch (err) {
      throw err;
    }
  }
  async orderAddress(
    userId: number,
    addres: AddressType,
    t: Transaction
  ): Promise<any> {
    try {
      console.log("🔍 [orderAddress] Looking for address:", {
        addressId: addres?.id,
        userId,
      });
      const address = await NewAddress.findOne({
        where: { id: Number(addres?.id) },
        raw: true,
        transaction: t,
      });
      console.log("✅ [orderAddress] Address found:", address);
      if (!address) throw new ServiceUnavailableException("Address Not found.");
      if (address.user_id != userId)
        throw new UnauthorizedException("Invalid Address");
      return address;
    } catch (err) {
      console.error("❌ [orderAddress] Error:", err.message);
      throw err;
    }
  }
  async afterCommit(
    t: Transaction,
    data: CreateOrderDto,
    newOrder: any,
    store: Store,
    orderItems: any[],
    address: any
  ) {
    try {
      t.afterCommit(async () => {
        //get items to remove from cart
        const itemstoRemove = data?.cart
          ?.filter((item: any) => item?.id && !isNaN(Number(item?.id)))
          .map((item: any) => Number(item?.id));

        //removing items from cart after the order is placed successfully
        if (itemstoRemove.length > 0) {
          await this.cartService.removeFromCart(itemstoRemove);
        }
        //getting store,user,address details to send emails and et.c
        const user = await newOrder.getUserDetails({
          row: true,
          attributes: ["name", "email", "fcmtoken"],
        });
        //increasing the order count in store
        await store.increment("order_count", { by: 1 });
        await this.notificationService.createNotification(
          "order",
          "Your New order has been Placed successfully.",
          "New Order",
          newOrder.order_id,
          newOrder.userId,
          orderItems[0]?.image,
          user?.fcmtoken
        );
        //seller notificcation.(push)
        await this.notificationService.sendPushNotification({
          to: store.fcmtoken,
          message: `You have received a new order #${newOrder?.order_id}`,
          title: "You have a new Order",
        });
        //after the order is placed we are sending emails to user and seller.
        const datass = {
          user: user,
          newOrder,
          store: store,
          address: address,
          products: orderItems,
        };
        let userMail = await ToUserOrderPlaced(datass);
        let storeMail = await ToSellerOrderPlaced(datass);
        this.mailService.sellerEmails(userMail);
        this.mailService.sellerEmails(storeMail);
      });
    } catch (err) {
      return null;
    }
  }
}
