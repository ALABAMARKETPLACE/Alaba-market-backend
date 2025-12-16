import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Sequelize, Transaction } from "sequelize";
import { Address } from "../ADDRESS/address.entity";
import { MailService } from "../MAILS/Mails.services";
import { ToUserOrderFailed } from "../MAILS/templates/orders/user_order_failed";
import { NotificationsService } from "../NOTIFICATIONS/notification.service";
import { OrderItems } from "../ORDER_ITEMS/order_items.entity";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { PaymentGateWayService } from "../PAYMENT_GATEWAY/payment_gateway.service";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { Products } from "../PRODUCTS/products.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Store } from "../STORE/store.entity";
import {
  AddressType,
  PrintItemsType,
  PrintItems as orderItemss,
  paymentType,
} from "./dto/print_types.dto";
import { Print } from "./print.entity";
import { CreatePrintDto } from "./dto/createPrint.dto";

@Injectable()
export class PrintLogService {
  constructor(
    @Inject("SEQUELIZE") private readonly sequelize: Sequelize,
    private readonly paymentGatewayService: PaymentGateWayService,
    private readonly notificationService: NotificationsService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService
  ) {}

  async create(userId: number, data: CreatePrintDto, remark: string) {
    try {
      const result = await this.sequelize.transaction(async (t) => {
        const newOrders = [];
        const verified = await this.basicCheck(data);
        // const products = await this.groupProducts(data.cart, t);
        const address = await this.orderAddress(userId, data.address, t);
        // for (const item of products) {
        //   const order = await this.placeOrder(userId, data, item, verified, t);
        //   const [qnty, total, itms] = await this.createItems(order.id, item, t);
        //   const store = await Store.findOne({
        //     where: { id: item.storeId },
        //     transaction: t,
        //   });
        //   order.totalItems = qnty;
        //   order.total = total;
        //   order.grandTotal = total; //inside modal
        //   order.address = address;
        //   await order.save({ transaction: t });
        //   const payment = await this.orderPayment(
        //     order.id,
        //     order.grandTotal,
        //     data.payment,
        //     t,
        //     remark
        //   );
        //   const orderStatus = await this.orderStatus(
        //     order.id,
        //     order.status,
        //     t,
        //     remark
        //   );
        //   newOrders.push({
        //     newOrder: order,
        //     orderPayment: payment,
        //     orderStatus: orderStatus,
        //     orderItems: itms,
        //     address: address,
        //   });
        //   await this.afterCommit(t, data, order, store, itms, address, remark);
        // }
        return newOrders;
      });
      return new DataResponseDto(result);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException();
    }
  }

  // async groupProducts(
  //   data: any[],
  //   transaction: Transaction
  // ): Promise<orderItemss[]> {
  //   try {
  //     const items: orderItemss[] = await data.reduce(
  //       async (accPromise, item) => {
  //         const acc = await accPromise;
  //         const storeId = await Products.findOne({
  //           attributes: ["store_id"],
  //           where: { _id: item?.productId },
  //           transaction,
  //         });
  //         if (storeId) {
  //           const obj: PrintItemsType = {
  //             id: item?.id,
  //             productId: item?.productId,
  //             quantity: item?.quantity,
  //             variantId: item?.variantId,
  //           };
  //           const exist = acc.find(
  //             (store: any) => store?.storeId == storeId?.store_id
  //           );
  //           if (exist) {
  //             exist?.products?.push(obj);
  //           } else {
  //             acc.push({
  //               storeId: storeId?.store_id,
  //               products: [obj],
  //             });
  //           }
  //         }
  //         return acc;
  //       },
  //       Promise.resolve([])
  //     );
  //     return items;
  //   } catch (err) {
  //     throw err;
  //   }
  // }
  async basicCheck(data: CreatePrintDto) {
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
    data: CreatePrintDto,
    product: orderItemss,
    verified: any,
    transaction: Transaction
  ) {
    try {
      const newOrder = await Print.create(
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
  // async createItems(
  //   orderId: number,
  //   items: orderItemss,
  //   t: Transaction
  // ): Promise<[number, number, OrderItems[]]> {
  //   const orderItems: OrderItems[] = [];
  //   let total = 0;
  //   let quantity = 0;
  //   try {
  //     for (const item of items?.products) {
  //       const product = await Products.findOne({
  //         where: { _id: item?.productId },
  //         transaction: t,
  //       });
  //       //============================================================================================
  //       const newItem = await OrderItems.create(
  //         {
  //           orderId,
  //           // productId: item?.productId,
  //           // variantId: item?.variantId,
  //           quantity: item?.quantity,
  //           price: product.retail_rate ?? 0,
  //           totalPrice: 0, //inside modal,
  //           image: product.image ?? "",
  //           name: product.name ?? "",
  //           sku: product.sku ?? "",
  //           barcode: product.bar_code ?? "",
  //         },
  //         { transaction: t }
  //       );
  //       //===========================================================================
  //       if (item?.variantId) {
  //         const variant = await ProductVariant.findOne({
  //           where: { id: item?.variantId },
  //           transaction: t,
  //         });
  //         newItem.price = variant?.price ?? 0;
  //         newItem.totalPrice = 0; //inside modal
  //         newItem.image = variant.image ?? "";
  //         newItem.sku = variant.sku ?? "";
  //         newItem.barcode = variant.barcode ?? "";
  //         newItem.combination = variant.combination ?? null;
  //         await newItem.save({ transaction: t });
  //       }
  //       total += newItem.totalPrice;
  //       quantity += newItem.quantity;
  //       orderItems.push(newItem);
  //     }
  //     return [quantity, total, orderItems];
  //   } catch (err) {
  //     throw err;
  //   }
  // }
  async orderPayment(
    orderId: number,
    grandTotal: number,
    payment: paymentType,
    t: Transaction,
    remark: string
  ) {
    try {
      const paymentInfo = payment?.ref
        ? await this.paymentGatewayService.getOrderDetails(payment?.ref)
        : null;
      let paymentStatus = "pending";
      if (payment?.ref) {
        if (
          paymentInfo?._embedded?.payment[0]?.state === "CAPTURED" &&
          paymentInfo?.amount?.value == grandTotal * 100
        ) {
          paymentStatus = "success";
        } else if (
          paymentInfo?._embedded?.payment[0]?.state === "CAPTURED" &&
          paymentInfo?.amount?.value != grandTotal * 100
        ) {
          paymentStatus = "incomplete";
        } else {
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
          currency: paymentInfo?.amount?.currencyCode,
          amount: paymentInfo?.amount?.value ?? grandTotal * 100,
          cardHolder: paymentInfo?.emailAddress,
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
      const address = await Address.findOne({
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
    data: CreatePrintDto,
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
        this.mailService.sellerEmails(userMail);
      });
    } catch (err) {
      return null;
    }
  }
}
