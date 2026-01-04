import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
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
import { ToUserOrderFailed } from "../MAILS/templates/orders/user_order_failed";
import { Order } from "./order.entity";
import { Transaction, ValidationError } from "sequelize";
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
import { JwtService } from "@nestjs/jwt";
import { PaystackService } from "../PAYSTACK_PAYMENT/paystack.service";

@Injectable()
export class OrderLogService {
  constructor(
    @InjectModel(Order)
    private readonly orderRepository: typeof Order,
    private readonly paymentGatewayService: PaymentGateWayService,
    private readonly paystackService: PaystackService,
    private readonly notificationService: NotificationsService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService
  ) {}

  async create(userId: number, data: CreateOrderDto, remark: string) {
    try {
      const result = await this.orderRepository.sequelize.transaction(async (t) => {
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
          order.totalItems = qnty;
          order.total = total;
          order.grandTotal = total; //inside modal
          order.address = address;
          await order.save({ transaction: t });
          const payment = await this.orderPayment(
            order.id,
            order.grandTotal,
            data.payment,
            t,
            remark
          );
          const orderStatus = await this.orderStatus(
            order.id,
            order.status,
            t,
            remark
          );
          newOrders.push({
            newOrder: order,
            orderPayment: payment,
            orderStatus: orderStatus,
            orderItems: itms,
            address: address,
          });
          await this.afterCommit(t, data, order, store, itms, address, remark);
        }
        return newOrders;
      });
      return new DataResponseDto(result);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException();
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
          const storeId = await Products.findOne({
            attributes: ["store_id"],
            where: { _id: item?.productId },
            transaction,
          });
          if (storeId) {
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
      if (Array.isArray(data.cart) == false || data?.cart?.length == 0)
        throw new BadRequestException("No Products Selected");
      //===================
      const verified = this.jwtService.decode(data?.charges?.token);
      return verified;
    } catch (err) {
      throw err;
    }
  }
  async placeOrder(
    userId: number,
    data: CreateOrderDto,
    product: orderItemss,
    verified: any,
    transaction: Transaction
  ) {
    try {
      const newOrder = await Order.create(
        {
          userId,
          addressId: data.address?.id,
          storeId: product.storeId,
          paymentType: data.payment?.ref
            ? "pay online"
            : data?.payment?.type == "Pay On Credit"
            ? "pay-on-credit"
            : "cash-on-delivery",
          tax: verified?.data?.tax ?? 0,
          deliveryCharge: verified?.data?.amount ?? 0,
          discount: verified?.data?.discount ?? 0,
          status: "failed",
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
        //============================================================================================
        const newItem = await OrderItems.create(
          {
            orderId,
            productId: item?.productId,
            variantId: item?.variantId,
            quantity: item?.quantity,
            price: product.retail_rate ?? 0,
            totalPrice: 0, //inside modal,
            image: product.image ?? "",
            name: product.name ?? "",
            sku: product.sku ?? "",
            barcode: product.bar_code ?? "",
          },
          { transaction: t }
        );
        //===========================================================================
        if (item?.variantId) {
          const variant = await ProductVariant.findOne({
            where: { id: item?.variantId },
            transaction: t,
          });
          newItem.price = variant?.price ?? 0;
          newItem.totalPrice = 0; //inside modal
          newItem.image = variant.image ?? "";
          newItem.sku = variant.sku ?? "";
          newItem.barcode = variant.barcode ?? "";
          newItem.combination = variant.combination ?? null;
          await newItem.save({ transaction: t });
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
      try {
        const paystackResponse = await this.paystackService.verifyPayment({
          reference: paymentRef,
        });

        if (
          paystackResponse.status &&
          paystackResponse.data.status === "success"
        ) {
          const amountInKobo = paystackResponse.data.amount;
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
      } catch (error) {
        return {
          verified: false,
          status: "failed",
          amount: grandTotal * 100,
          currency: "NGN",
          email: null,
          gateway: "paystack",
        };
      }
    } else {
      // Verify with Network International
      try {
        const niResponse = await this.paymentGatewayService.getOrderDetails(
          paymentRef
        );

        if (niResponse?._embedded?.payment[0]?.state === "CAPTURED") {
          const amount = niResponse.amount?.value;
          const expectedAmount = grandTotal * 100;

          return {
            verified: true,
            status: amount === expectedAmount ? "success" : "incomplete",
            amount: amount,
            currency: niResponse.amount?.currencyCode,
            email: niResponse.emailAddress,
            gateway: "network_international",
          };
        } else {
          return {
            verified: false,
            status: "failed",
            amount: grandTotal * 100,
            currency: "USD",
            email: null,
            gateway: "network_international",
          };
        }
      } catch (error) {
        return {
          verified: false,
          status: "failed",
          amount: grandTotal * 100,
          currency: "USD",
          email: null,
          gateway: "network_international",
        };
      }
    }
  }

  async orderPayment(
    orderId: number,
    grandTotal: number,
    payment: paymentType,
    t: Transaction,
    remark: string
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
          paymentStatus = paymentInfo.status;
        } catch (verifyError) {
          console.error(
            "Payment verification error in log service:",
            verifyError
          );
          paymentStatus = "failed";
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
          status: remark != "Payment is Failed." ? paymentStatus : "failed",
          ref:
            remark != "Payment is Failed."
              ? payment?.ref
              : payment?.ref + `-${Math.floor(Math.random() * 100)}`,
          currency: paymentInfo?.currency,
          amount: paymentInfo?.amount ?? grandTotal * 100,
          cardHolder: paymentInfo?.email,
        },
        { transaction: t }
      );
      return newPayment;
    } catch (err) {
      return {
        orderId,
        paymentType: payment?.ref
          ? "pay-online"
          : payment?.type == "Pay On Credit"
          ? "pay-on-credit"
          : "cash-on-delivery",
        status: "pending",
        ref: null,
        amount: grandTotal * 100,
      };
    }
  }
  async orderStatus(
    orderId: number,
    status: string,
    t: Transaction,
    remark: string
  ) {
    try {
      const orderStatus = await OrderStatus.create(
        {
          orderId,
          status: "failed",
          remark,
        },
        { transaction: t }
      );
      return orderStatus;
    } catch (err) {
      return { orderId, status: "failed", remark };
    }
  }
  async orderAddress(
    userId: number,
    addres: AddressType,
    t: Transaction
  ): Promise<any> {
    try {
      const address = await NewAddress.findOne({
        where: { id: Number(addres?.id) },
        raw: true,
        transaction: t,
      });
      return address;
    } catch (err) {
      return { message: "Unable to Find the Address." };
    }
  }
  async afterCommit(
    t: Transaction,
    data: CreateOrderDto,
    newOrder: any,
    store: Store,
    orderItems: any[],
    address: any,
    remark
  ) {
    try {
      t.afterCommit(async () => {
        //getting store,user,address details to send emails and et.c
        const user = await newOrder.getUserDetails({
          row: true,
          attributes: ["name", "email"],
        });
        //increasing the order count in store
        await this.notificationService.createNotification(
          "order",
          remark,
          "Your Order has been Failed",
          newOrder.order_id,
          newOrder.userId,
          orderItems[0]?.image
        );
        //after the order is placed we are sending emails to user and seller.
        const datass = {
          user: user,
          newOrder,
          store: store,
          address: address,
          products: orderItems,
          remark,
        };
        let userMail = await ToUserOrderFailed(datass);
        // let storeMail = await ToSellerOrderPlaced(datass);
        this.mailService.sellerEmails(userMail);
        // this.mailService.sellerEmails(storeMail);
      });
    } catch (err) {
      return null;
    }
  }
}
