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
import { JwtService } from "@nestjs/jwt";
import { Sequelize, Transaction } from "sequelize";
import { Address } from "../ADDRESS/address.entity";
import { CartServices } from "../CART/cart.services";
import { MailService } from "../MAILS/Mails.services";
import { ToSellerOrderPlaced } from "../MAILS/templates/orders/toSeller_OrderPlaced";
import { ToUserOrderPlaced } from "../MAILS/templates/orders/toUser_OrderPlaced";
import { NotificationsService } from "../NOTIFICATIONS/notification.service";
import { OrderItems } from "../ORDER_ITEMS/order_items.entity";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { PaymentGateWayService } from "../PAYMENT_GATEWAY/payment_gateway.service";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { Products } from "../PRODUCTS/products.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Store } from "../STORE/store.entity";
import {
  AddressType,
  PrintItemsType,
  PrintItems as orderItemss,
  paymentType,
} from "./dto/print_types.dto";
import { Print } from "./print.entity";
import { PrintLogService } from "./print.log";
import { CreatePrintDto } from "./dto/createPrint.dto";
import { PrintItems } from "../PRINT_ITEMS/print_items.entity";
import { PrintConfigeration } from "../PRINT_CONFIGERATION/print_configeration.entity";
import { PrintStatus } from "../PRINT_STATUS/print_status.entity";
import { ExceptionsHandler } from "@nestjs/core/exceptions/exceptions-handler";

@Injectable()
export class PrintPlaceService {
  constructor(
    @Inject("SEQUELIZE") private readonly sequelize: Sequelize,
    private readonly paymentGatewayService: PaymentGateWayService,
    private readonly cartService: CartServices,
    private readonly notificationService: NotificationsService,
    private readonly mailService: MailService,
    private readonly printLogService: PrintLogService,
    private readonly jwtService: JwtService
  ) {}

  async create(userId: number, data: CreatePrintDto) {
    try {
      const result = await this.sequelize.transaction(async (t) => {
        const newPrints = [];
        const verified = await this.basicCheck(data);
        const products = await this.groupProducts(
          data.cart,
          data?.storeId,
          t
        );
        const address = await this.orderAddress(userId, data.address, t);
        const store = await Store.findByPk( data?.storeId);
        for (const item of products) {
          const print = await this.placeOrder(userId, data, item, verified, t);
          const [qnty, total, itms] = await this.createItems(print.id, item, t);
          if(total < 0 || qnty < 0){
            throw new NotFoundException('Invalid quantity or price')
          }
          

          const deliveryDate = new Date();
          deliveryDate.setMinutes(
            deliveryDate.getMinutes() + (store?.delivery_period_minutes ?? 10)
          );
          print.delivery_date = deliveryDate;
          print.totalItems = qnty;
          print.total = total;
          print.grandTotal = total; //inside modal
          print.address = address;
          await print.save({ transaction: t });
          const payment = await this.orderPayment(
            print.id,
            print.grandTotal,
            data.payment,
            t
          );
          const printStatus = await this.printStatus(print.id, print.status, t);
          newPrints.push({
            newOrder: print,
            orderPayment: payment,
            printStatus: printStatus,
            orderItems: itms,
            address: address,
          });
          await this.afterCommit(t, data, print, store, itms, address);
        }
        return newPrints;
      });
      return new DataResponseDto(result);
    } catch (err) {
      console.log(err);
      if (err instanceof NotFoundException) {
        throw err; 
      }
      try {
        return await this.printLogService.create(
          userId,
          data,
          err instanceof HttpException ? err.message : getErrorMessage(err)
        );
      } catch (err) {
        if (err instanceof HttpException) throw err;
        throw new InternalServerErrorException();
      }
    }
  }

  async groupProducts(
    data: any[],
    storeId: number,
    transaction: Transaction
  ): Promise<orderItemss[]> {
    try {
      const resolvedProducts = await Promise.all(
        data.map(async (item) => {
          const configuration = await PrintConfigeration.findOne({
            where: {
              printType: item?.printType,
              printColor: item?.printColor,
              doublesided: item?.doublesided ? item?.doublesided : false,
            },
            transaction,
          });

          return {
            quantity: item.quantity,
            image: item.image,
            price: item?.price,
            orientation: item.orientation,
            printConfigerationId: configuration?.id,
            number_of_pages:item?.number_of_pages,
            name:item?.name
          };
        })
      );

      const result: orderItemss[] = [
        {
          storeId: storeId,
          products: resolvedProducts,
        },
      ];

      return result;
    } catch (err) {
      throw err;
    }
  }
  async basicCheck(data: CreatePrintDto) {
    try {
      if (Array.isArray(data.cart) == false || data?.cart?.length == 0)
        throw new BadRequestException("No print Selected");
      //===================
      const verified = this.jwtService.decode(data?.charges?.token);
      if (!verified || isNaN(verified?.data?.amount))
        throw new BadRequestException("Failed to Calculate Delivery charge.");
      //=====================
      if (verified?.data?.addressId != data?.address?.id)
        throw new ServiceUnavailableException("Invalid Address Found.");
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
      const newPrint = await Print.create(
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
          deliveryCharge: verified?.data?.amount,
          discount: verified?.data?.discount ?? 0,
        },
        { transaction }
      );
      return newPrint;
    } catch (err) {
      throw err;
    }
  }

  async createItems(
    printId: number,
    items: orderItemss,
    t: Transaction
  ): Promise<[number, number, OrderItems[]]> {
    const orderItems: OrderItems[] = [];
    let total = 0;
    let quantity = 0;
    try {
      for (const item of items?.products) {
        // if (product.storeId != items.storeId)
        //   throw new ServiceUnavailableException(
        //     "Print is Not Available on this store."
        //   );
        const price = await PrintConfigeration.findOne({
          where:{
            id:item?.printConfigerationId
          },
          attributes:["amount"],
          plain:true
        })
        const newItem: any = await PrintItems.create(
          {
            printId,
            quantity: item?.quantity,
            price: price?.amount,
            totalPrice: item?.quantity * price?.amount * item?.number_of_pages, 
            image: item?.image,
            orientation: item?.orientation,
            printConfigerationId:item?.printConfigerationId,
            name:item?.name,
            number_of_pages:item?.number_of_pages
          },
          { transaction: t }
        );

        // if (item?.variantId) {
        //   const variant = await ProductVariant.findOne({
        //     where: { id: item?.variantId },
        //     transaction: t,
        //   });
        //   if (!variant) throw new NotFoundException("Variant is Not Available");
        //   if (variant.productId != item?.productId)
        //     throw new ServiceUnavailableException("Variant is Not Available");
        //   if (variant.units == 0 || variant.units < item?.quantity)
        //     throw new ServiceUnavailableException("Variant is out of stock");
        //   newItem.price = variant.price;
        //   newItem.totalPrice = 0; //inside modal
        //   newItem.image = variant.image;
        //   newItem.sku = variant.sku;
        //   newItem.barcode = variant.barcode;
        //   newItem.combination = variant.combination;
        //   await newItem.save({ transaction: t });
        //   await variant.decrement("units", {
        //     by: Number(item?.quantity),
        //     transaction: t,
        //   });
        // }
        total += newItem.totalPrice;
        quantity += newItem.quantity;
        orderItems.push(newItem);
      }
      return [quantity, total, orderItems];
    } catch (err) {
      throw err;
    }
  }

  async orderPayment(
    printId: number,
    grandTotal: number,
    payment: paymentType,
    t: Transaction
  ) {
    try {
      console.log('this is the printId',printId)
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
          throw new NotAcceptableException("Payment is Failed.");
        }
      } else {
        paymentStatus = "pending";
      }
      const newPayment = await OrderPayments.create(
        {
          printId,
          paymentType: payment?.ref
            ? "pay-online"
            : payment?.type == "Pay On Credit"
            ? "pay-on-credit"
            : "cash-on-delivery",
          status: paymentStatus,
          ref: payment?.ref,
          currency: paymentInfo?.amount?.currencyCode,
          amount: paymentInfo?.amount?.value ?? grandTotal * 100,
          cardHolder: paymentInfo?.emailAddress,
        },
        { transaction: t }
      );
      return newPayment;
    } catch (err) {
      console.log('this is the errror',err)
      throw err;
    }
  }
  async printStatus(printId: number, status: string, t: Transaction) {
    try {
      const orderStatus = await PrintStatus.create(
        {
          printId,
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
      const address = await Address.findOne({
        where: { id: Number(addres?.id) },
        raw: true,
        transaction: t,
      });
      if (!address) throw new ServiceUnavailableException("Address Not found.");
      if (address.userId != userId)
        throw new UnauthorizedException("Invalid Address");
      return address;
    } catch (err) {
      throw err;
    }
  }
  async afterCommit(
    t: Transaction,
    data: CreatePrintDto,
    newOrder: any,
    store: Store,
    orderItems: any[],
    address: any
  ) {
    try {
      t.afterCommit(async () => {
        //get items to remove from cart
        const itemstoRemove = data?.cart?.map((item: any) => {
          if (isNaN(Number(item?.id)) == false) {
            return Number(item?.id);
          }
        });
        //removing items from cart after the order is placed successfully
        await this.cartService.removeFromCart(itemstoRemove);
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
