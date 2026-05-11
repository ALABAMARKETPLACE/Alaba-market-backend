import {
  BadRequestException,
  Inject,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotImplementedException,
  NotAcceptableException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  forwardRef,
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
import { Op, Transaction, literal } from "sequelize";
import { InjectModel } from "@nestjs/sequelize";
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
import { PaymentTypeEnum } from "./dto/payment-type.enum";

type CreateOrderOptions = {
  skipDeliveryTokenVerification?: boolean;
  verifiedChargesData?: any;
};

@Injectable()
export class OrderPlaceService {
  constructor(
    @InjectModel(Order)
    private readonly orderRepository: typeof Order,
    private readonly paymentGatewayService: PaymentGateWayService,
    @Inject(forwardRef(() => PaystackService))
    private readonly paystackService: PaystackService,
    private readonly cartService: CartServices,
    private readonly notificationService: NotificationsService,
    private readonly mailService: MailService,
    private readonly orderLogService: OrderLogService,
    private readonly jwtService: JwtService
  ) {}

  async create(
    userId: number,
    data: CreateOrderDto,
    options: CreateOrderOptions = {}
  ) {
    try {
      if (this.shouldInitializeHostedCheckout(data, options)) {
        return await this.initializeHostedCheckout(userId, data);
      }

      const result = await this.orderRepository.sequelize!.transaction(
        async (t) => {
          const newOrders: any[] = [];
          const verified = await this.basicCheck(data, options);

          const products = await this.groupProducts(data.cart, t);
          const address = await this.orderAddress(userId, data.address, t);
          const isMultiSeller = products.length > 1;
          for (const item of products) {
            const order = await this.placeOrder(
              userId,
              data,
              item,
              verified,
              isMultiSeller,
              t
            );
            const [qnty, total, itms] = await this.createItems(
              order.id,
              item,
              t
            );
            const store = await Store.findOne({
              where: { id: item.storeId },
              transaction: t,
            });
            if (!store) {
              throw new NotFoundException(`Store ${item.storeId} not found`);
            }
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
            order.grandTotal = Number(
              (
                Number(total || 0) +
                Number(order.deliveryCharge || 0) +
                Number(order.tax || 0) -
                Number(order.discount || 0)
              ).toFixed(2)
            );
            order.address = address;
            await order.save({ transaction: t });
            const payment = await this.orderPayment(
              order.id,
              order.grandTotal,
              data.payment,
              t
            );
            const orderStatus = await this.orderStatus(
              order.id,
              order.status,
              t
            );
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
        }
      );
      return new DataResponseDto(result);
    } catch (err) {
      console.log(err);
      if (this.shouldInitializeHostedCheckout(data, options)) {
        if (err instanceof HttpException) throw err;
        throw new InternalServerErrorException(getErrorMessage(err));
      }

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
      throw new NotFoundException("Product not found.");
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
      throw new NotFoundException("Variant is Not Available");
    }

    return variant;
  }

  async groupProducts(
    data: any[],
    transaction?: Transaction
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

  async basicCheck(data: CreateOrderDto, options: CreateOrderOptions = {}) {
    try {
      console.log("🔍 [basicCheck] Starting order validation...");

      if (data?.payment?.type === PaymentTypeEnum.CashOnDelivery) {
        throw new BadRequestException("Cash on delivery is not available");
      }

      //===================
      if (!Array.isArray(data.cart) || data.cart.length === 0) {
        throw new BadRequestException("No Products Selected");
      }

      let verified: any = options.verifiedChargesData;

      if (!options.skipDeliveryTokenVerification) {
        console.log("🔍 [basicCheck] Verifying delivery charge token...");
        verified = await this.jwtService.verifyAsync(data?.charges?.token);
      }

      console.log("✅ [basicCheck] Verified token:", verified);

      if (!verified || isNaN(Number(verified?.data?.amount))) {
        throw new BadRequestException("Failed to Calculate Delivery charge.");
      }

      //=====================
      console.log("[basicCheck] Comparing address IDs:");
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

      const tokenAddressId = Number(verified?.data?.addressId);
      const requestAddressId = Number(data?.address?.id);

      console.log(
        "   - After conversion:",
        tokenAddressId,
        "vs",
        requestAddressId
      );

      if (tokenAddressId !== requestAddressId) {
        throw new ServiceUnavailableException("Invalid Address Found.");
      }

      console.log("✅ [basicCheck] Address validation passed!");
      return verified;
    } catch (err) {
      console.error("❌ [basicCheck] Error:", (err as any).message);
      throw err;
    }
  }

  private shouldInitializeHostedCheckout(
    data: CreateOrderDto,
    options: CreateOrderOptions
  ): boolean {
    if (options.skipDeliveryTokenVerification) {
      return false;
    }

    return !data?.payment?.ref && this.isOnlineGateway(data?.payment?.type);
  }

  private isOnlineGateway(paymentType?: PaymentTypeEnum): boolean {
    return [
      PaymentTypeEnum.Paystack,
      PaymentTypeEnum.Stripe,
      PaymentTypeEnum.Flutterwave,
    ].includes(paymentType as PaymentTypeEnum);
  }

  private async initializeHostedCheckout(
    userId: number,
    data: CreateOrderDto
  ): Promise<DataResponseDto> {
    switch (data.payment.type) {
      case PaymentTypeEnum.Paystack: {
        const result =
          await this.paystackService.initializeAuthenticatedCheckout(userId, {
            order_payload: data,
            callback_url: data.payment.callback_url,
          });

        return new DataResponseDto(result.data, true, result.message);
      }

      case PaymentTypeEnum.Stripe:
      case PaymentTypeEnum.Flutterwave:
        throw new NotImplementedException(
          `${data.payment.type} checkout is not implemented yet.`
        );

      default:
        throw new BadRequestException("Unsupported payment type.");
    }
  }

  async prepareAuthenticatedCheckout(userId: number, data: CreateOrderDto) {
    const verified = await this.basicCheck(data);

    return this.orderRepository.sequelize!.transaction(async (t) => {
      const products = await this.groupProducts(data.cart, t);
      await this.orderAddress(userId, data.address, t);

      let grandTotal = 0;
      const store_summaries: Array<{
        store_id: number;
        product_total: number;
        discount: number;
      }> = [];

      for (const groupedProduct of products) {
        const itemsTotal = await this.calculateItemsTotal(groupedProduct, t);
        const charges = this.getStoreChargeBreakdown(
          verified,
          groupedProduct.storeId
        );
        grandTotal +=
          itemsTotal +
          Number(charges.deliveryCharge || 0) +
          Number(charges.tax || 0) -
          Number(charges.discount || 0);
        store_summaries.push({
          store_id: groupedProduct.storeId,
          product_total: itemsTotal,
          discount: Number(charges.discount || 0),
        });
      }

      return {
        verified,
        amount: grandTotal,
        amount_kobo: Math.round(grandTotal * 100),
        store_ids: products.map((item) => item.storeId),
        store_summaries,
      };
    });
  }

  private getStoreChargeBreakdown(verified: any, storeId: number) {
    const getStoreValue = (value: any, key: string, fallback = 0) => {
      if (Array.isArray(value)) {
        const match = value.find(
          (item: any) =>
            Number(item?.storeId ?? item?.store_id) === Number(storeId)
        );
        return Number(match?.[key] ?? match?.totalCharge ?? fallback);
      }

      return Number(value ?? fallback);
    };

    return {
      discount: getStoreValue(verified?.data?.discount, "discount", 0),
      deliveryCharge: Array.isArray(verified?.data?.deliveryCharges)
        ? Number(
            verified?.data?.deliveryCharges?.find(
              (item: any) =>
                Number(item?.storeId ?? item?.store_id) === Number(storeId)
            )?.totalCharge ?? 0
          )
        : Number(verified?.data?.amount ?? 0),
      tax: getStoreValue(verified?.data?.tax, "tax", 0),
    };
  }

  private async calculateItemsTotal(
    items: orderItemss,
    transaction: Transaction
  ): Promise<number> {
    let total = 0;

    for (const item of items.products) {
      const quantity = this.normalizeOrderQuantity(item, item?.productId);
      const product = await this.loadStockProduct(item?.productId, transaction);

      if (!product) throw new NotFoundException("Product not found.");
      if (product.status == false)
        throw new ServiceUnavailableException("Product is Not Available");
      if (product.store_id != items.storeId)
        throw new ServiceUnavailableException(
          "Product is Not Available on this store."
        );
      if (product.unit < quantity)
        throw new ServiceUnavailableException("Product out of stock");

      let unitPrice = Number(product.retail_rate || 0);

      if (item?.variantId) {
        const variant = await this.loadStockVariant(item?.variantId, transaction);

        if (!variant) throw new NotFoundException("Variant is Not Available");
        if (variant.productId != item?.productId)
          throw new ServiceUnavailableException("Variant is Not Available");
        if (variant.units < quantity)
          throw new ServiceUnavailableException("Variant is out of stock");

        unitPrice = Number(variant.price || 0);
      }

      total += unitPrice * quantity;
    }

    return total;
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
    isMultiSeller: boolean,
    transaction: Transaction
  ) {
    try {
      const charges = this.getStoreChargeBreakdown(verified, product?.storeId);

      const newOrder = await Order.create(
        {
          userId,
          addressId: data.address?.id,
          storeId: product?.storeId,
          is_multi_seller: isMultiSeller,
          paymentType: this.resolveOrderPaymentType(data.payment),
          tax: charges.tax,
          deliveryCharge: charges.deliveryCharge,
          discount: charges.discount,
          payment_reference: data?.payment?.ref || undefined,
          transaction_reference: data?.payment?.ref || undefined,
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
        const orderedQuantity = this.normalizeOrderQuantity(item, item?.productId);
        const product = await this.loadStockProduct(item?.productId, t);
        if (!product) throw new NotFoundException("Product not found.");
        if (product.status == false)
          throw new ServiceUnavailableException("Product is Not Available");
        if (product.store_id != items.storeId)
          throw new ServiceUnavailableException(
            "Product is Not Available on this store."
          );
        if (product.unit < orderedQuantity)
          throw new ServiceUnavailableException("Product out of stock");

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
          throw new ServiceUnavailableException("Product out of stock");
        }

        await product.increment("orderCount", { by: 1, transaction: t });
        //============================================================================================
        const newItem = await OrderItems.create(
          {
            orderId,
            productId: item?.productId,
            variantId: item?.variantId || undefined,
            quantity: orderedQuantity,
            price: product.retail_rate,
            totalPrice: Number(product.retail_rate || 0) * orderedQuantity,
            image: product.image,
            name: product.name,
            sku: product.sku,
            barcode: product.bar_code,
          } as any,
          { transaction: t }
        );
        //===========================================================================
        if (item?.variantId) {
          const variant = await this.loadStockVariant(item?.variantId, t);
          if (variant.productId != item?.productId)
            throw new ServiceUnavailableException("Variant is Not Available");
          if (variant.units < orderedQuantity)
            throw new ServiceUnavailableException("Variant is out of stock");
          newItem.price = variant.price;
          newItem.totalPrice = Number(variant.price || 0) * orderedQuantity;
          newItem.image = variant.image;
          newItem.sku = variant.sku;
          newItem.barcode = variant.barcode;
          newItem.combination = variant.combination;
          await newItem.save({ transaction: t });

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
            throw new ServiceUnavailableException("Variant is out of stock");
          }
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
        paystackResponse.data?.status === "success"
      ) {
        const amountInKobo = paystackResponse.data?.amount; // Paystack amount is in kobo
        const expectedAmountInKobo = grandTotal * 100;

        return {
          verified: true,
          status:
            amountInKobo === expectedAmountInKobo ? "success" : "incomplete",
          amount: amountInKobo,
          currency: paystackResponse.data?.currency,
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
    const status = payment?.ref ? "pending" : "pending";

    return await OrderPayments.create(
      {
        orderId,
        paymentType: this.resolveOrderPaymentType(payment),
        status,
        ref: payment?.ref || "",
        amount: grandTotal * 100,
      } as any,
      { transaction: t }
    );
  }

  private resolveOrderPaymentType(payment?: paymentType): string {
    switch (payment?.type) {
      case PaymentTypeEnum.Paystack:
      case PaymentTypeEnum.Stripe:
      case PaymentTypeEnum.Flutterwave:
        return "pay-online";
      case PaymentTypeEnum.PayOnCredit:
        return "pay-on-credit";
      case PaymentTypeEnum.CashOnDelivery:
      default:
        return "cash-on-delivery";
    }
  }
  async orderStatus(orderId: number, status: string, t: Transaction) {
    try {
      const orderStatus = await OrderStatus.create(
        {
          orderId,
          status,
          remark: "your order is getting processed.",
        } as any,
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
      console.log("[orderAddress] Looking for address:", {
        addressId: addres?.id,
        userId,
      });
      const address = await NewAddress.findOne({
        where: { id: Number(addres?.id) },
        raw: true,
        transaction: t,
      });
      console.log("[orderAddress] Address found:", address);
      if (!address) throw new ServiceUnavailableException("Address Not found.");
      if (address.user_id != userId)
        throw new UnauthorizedException("Invalid Address");
      return address;
    } catch (err) {
      console.error("[orderAddress] Error:", (err as any).message);
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
        await this.mailService.sellerEmails(userMail);
        await this.mailService.sellerEmails(storeMail);
      });
    } catch (err) {
      return null;
    }
  }
}
