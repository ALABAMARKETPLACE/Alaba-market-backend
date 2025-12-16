import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { OrderSubstitution } from "./substitution.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateSubstitutionDto } from "./dto/create.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { OrderItems } from "../ORDER_ITEMS/order_items.entity";
import { Op, Sequelize, Transaction, literal, or, where } from "sequelize";
import { SubstituteProducts } from "./substitute.products.entity";
import { Order } from "../ORDER/order.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { NotificationsModal } from "../NOTIFICATIONS/notification.entity";
import { Products } from "../PRODUCTS/products.entity";
import { UUID } from "crypto";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { Store } from "../STORE/store.entity";
import { Address } from "../ADDRESS/address.entity";
import { NotificationsService } from "../NOTIFICATIONS/notification.service";
import { ToUserOrderSubstitution } from "../MAILS/templates/orders/order_substitution_user";
import { MailService } from "../MAILS/Mails.services";
import { TokenGateway } from "../SUBSTITUTION_SOKET/token.gateway";
import { error } from "console";

@Injectable()
export class OrderSubstitutionService {
  constructor(
    @Inject("substitutionRepository")
    private readonly repository: typeof OrderSubstitution,
    @Inject("substitutionProductsRepo")
    private readonly productrepo: typeof SubstituteProducts,
    @Inject("SEQUELIZE") private readonly sequelize: Sequelize,
    private readonly tokenGateway: TokenGateway,
    private readonly notificationService: NotificationsService,
    private readonly mailService: MailService
  ) {}

  async create(data: CreateSubstitutionDto, storeId: number) {
    try {
      console.log("this is the data i get", data, storeId);
      const result = await this.sequelize.transaction(async (transaction) => {
        const orderItems: any = await OrderItems.findOne({
          where: { id: data.orderItemId },
          include: [
            {
              model: Order,
              required: true,
              where: { storeId },
              as: "orderDetails", // Make sure this alias matches your model definition
            },
          ],
          transaction,
        });

        if (!orderItems) {
          throw new NotFoundException("Selected Order not found");
        }
        console.log("orderItems.quantity", orderItems.quantity);
        const newone = await this.repository.create(
          {
            orderId: Sequelize.literal(
              `(SELECT "id" FROM "ORDER" WHERE "order_id" = ${data.orderId})`
            ),

            orderItemId: data.orderItemId,
            availableQuantity: data?.availableQuantity,
            substitueQuantity:
              orderItems.quantity -
              (data?.availableQuantity ? data?.availableQuantity : 0),
            status: "pending",
            remark: data?.remark,
          },
          { transaction }
        );

        if (newone.substitueQuantity < 0) {
          throw new BadRequestException("Invalid Quantity selected");
        }

        await this.productrepo.bulkCreate(
          data.substitute?.map((it) => ({
            productId: it,
            substitutionId: newone.id,
          })),
          { transaction }
        );

        await Order.update(
          { status: "substitution" },
          {
            where: {
              order_id: data.orderId,
            },
            transaction,
          }
        );

        await OrderStatus.create(
          {
            orderId: newone.orderId,
            status: `substitution`,
            remark: `Order Substitution Requested for ${orderItems.name}`,
          },
          { transaction }
        );
        // const address = await this.orderAddress(userId, data.address, transaction);
        const store = await Store.findByPk(storeId);
        const order = await Order.findOne({
          where: { order_id: data?.orderId },
        });
        const address = await Address.findByPk(order?.addressId);
        const substitutedProduct = await Products.findAll({
          where: {
            _id: data?.substitute,
          },
        });
        console.log("this one order", order);
        await this.afterCommit(
          transaction,
          data,
          order,
          store,
          orderItems,
          address,
          substitutedProduct
        );

        // Get the userId from the order
        if (!orderItems.orderDetails || !orderItems.orderDetails.userId) {
          console.log(
            `No userId found for order ${data.orderId}, cannot send WebSocket notification`
          );
        } else {
          const userId = orderItems.orderDetails.userId;
          console.log(`Sending substitution notification to user ${userId}`);

          // Make sure we're explicitly using broadcastToUser not broadcastToken
          this.tokenGateway.broadcastToUser(userId, {
            id:order?.id,
            type: "substitution",
            orderId: data.orderId,
            itemName: orderItems.name,
            itemImage: orderItems.image,
            message: `Substitution requested for ${orderItems.name}`,
            timestamp: new Date().toISOString(),
          });
        }

        return newone;
      });

      return new DataResponseDto(result);
    } catch (err) {
      console.log("this is the error", err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getSubstitution(order_id: number) {
    try {
      const pAttributes: any[] = [
        "name",
        "image",
        "category",
        "description",
        "retail_rate",
        "status",
        "subCategory",
        "title",
        "unit",
        "price",
        "pid",
        "slug",
        "averageRating",
        "totalReviews",
      ].map((item) => [
        literal(`"substituteProducts->productDetails"."${item}"`),
        item,
      ]);
      const products = await this.repository.findOne({
        attributes: { exclude: ["orderItemId", "createdAt", "updatedAt"] },
        where: {
          orderId: {
            [Op.eq]: literal(
              `(SELECT "id" FROM "ORDER" WHERE "ORDER"."order_id" = ?)`
            ),
          },
          status: "pending",
        },
        include: [
          {
            model: SubstituteProducts,
            required: true,
            attributes: pAttributes,

            include: [
              {
                model: Products,
                // required: true,
                attributes: [],
              },
            ],
          },
          { model: OrderItems, required: true },
        ],
        replacements: [order_id],
      });
      if (!products) throw new NotFoundException();
      return new DataResponseDto(products);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getFiveMintCheck(userId: number) {
    try {
      console.log("userId", userId);
      console.log("userId", userId);
      // Get the current timestamp
      const currentTime = new Date();

      // Calculate the timestamp from 5 minutes ago
      const fiveMinutesAgo = new Date(currentTime.getTime() - 5 * 60 * 1000);

      // Find orders created by this user in the last 5 minutes
      const recentOrders = await this.repository.findOne({
        where: {
          createdAt: {
            [Op.gte]: fiveMinutesAgo,
          },
        },
        include: [
          {
            model: Order,
            required: true,
            where: {
              userId,
            },
          },
          {
            model:OrderItems,
            required:true
          }
        ],
        order: [["createdAt", "DESC"]],
      });


      if(!recentOrders){
        throw new NotFoundException("No recent substitution orders for you! @@")
      }


      // Check if there are any orders within the last 5 minutes

      const data = {
        id:recentOrders?.orderDetails?.id,
        userId,
        type: "substitution",
        orderId: recentOrders?.orderDetails?.order_id,
        itemName: recentOrders?.orderItemDetails?.name,
        itemImage: recentOrders?.orderItemDetails?.image,
        message: `Substitution requested for ${recentOrders?.orderItemDetails?.name}`,
        timestamp: new Date().toISOString(),
        read:recentOrders?.read
      };

      return { data };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }

  // async substituteOrder(
  //   userId: number,
  //   substitutionId: number,
  //   productId: UUID
  // ) {
  //   try {
  //     const result = await this.sequelize.transaction(async (transaction) => {
  //       let total = 0;
  //       let quantity = 0;
  //       const substitution = await this.repository.findOne({
  //         where: {
  //           id: substitutionId,
  //           status: "pending",
  //         },
  //         transaction,
  //       });
  //       if (!substitution)
  //         throw new NotFoundException("No substitution is found.");
  //       substitution.status = "accepted";
  //       substitution.read = true;
  //       await substitution.save({ transaction });
  //       const orderItem = await OrderItems.findOne({
  //         where: {
  //           id: substitution.orderItemId,
  //         },
  //         transaction,
  //       });
  //       if (!orderItem)
  //         throw new NotFoundException("No Order has been found..");
  //       orderItem.quantity = substitution?.availableQuantity
  //         ? substitution?.availableQuantity
  //         : substitution?.substitueQuantity;
  //       orderItem.totalPrice =
  //         (substitution?.availableQuantity
  //           ? substitution?.availableQuantity
  //           : substitution?.substitueQuantity) * orderItem.price;
  //       await orderItem.save({ transaction });
  //       total += orderItem.totalPrice;
  //       quantity += orderItem.quantity;
  //       const product = await Products.findOne({
  //         where: { pid: productId },
  //         transaction,
  //       });
  //       if (product.status == false)
  //         throw new ServiceUnavailableException("Product is Not Available");
  //       // if (product.store_id != items.storeId)
  //       //   throw new ServiceUnavailableException(
  //       //     "Product is Not Available on this store."
  //       //   );
  //       if (product.unit == 0 || product.unit < substitution.substitueQuantity)
  //         throw new ServiceUnavailableException("Product out of stock");
  //       await product.decrement("unit", {
  //         by: Number(substitution.substitueQuantity),
  //         transaction,
  //       });
  //       const newOrderItem = await OrderItems.create(
  //         {
  //           orderId: substitution.orderId,
  //           productId: product._id,
  //           // variantId: item?.variantId,
  //           quantity: substitution?.availableQuantity
  //             ? substitution?.availableQuantity
  //             : substitution?.substitueQuantity,
  //           price: product.retail_rate,
  //           totalPrice:
  //             product.retail_rate *
  //             (substitution?.availableQuantity
  //               ? substitution?.availableQuantity
  //               : substitution?.substitueQuantity),
  //           image: product.image,
  //           name: product.name,
  //           sku: product.sku,
  //           barcode: product.bar_code,
  //         },
  //         { transaction }
  //       );

  //       const orderStatus = await OrderStatus.create(
  //         {
  //           orderId: substitution.orderId,
  //           status: "processing",
  //           remark: `Your Order Substitution is Successfull for ${newOrderItem.name} (${newOrderItem.quantity} unit)`,
  //         },
  //         { transaction }
  //       );
  //       const orderItems = await OrderItems.findAll({
  //         where: {
  //           orderId: substitution.orderId,
  //           productId: {
  //             [Op.notIn]: [orderItem.productId],
  //           },
  //         },
  //       });
  //       for (const item of orderItems) {
  //         total += item?.totalPrice;
  //         quantity += item?.quantity;
  //       }
  //       total += newOrderItem.totalPrice;
  //       quantity += newOrderItem.quantity;
  //       const order = await Order.findOne({
  //         where: {
  //           id: substitution.orderId,
  //         },
  //         transaction,
  //       });
  //       if (!order) throw new NotFoundException();
  //       order.totalItems = quantity;
  //       order.total = total;
  //       order.grandTotal =
  //         total + order.deliveryCharge + order.tax - order.discount;
  //       order.status = "processing";
  //       await order.save({ transaction });

  //       const payment = await OrderPayments.findOne({
  //         where: {
  //           orderId: substitution.orderId,
  //         },
  //       });
  //       payment.amount = order.grandTotal * 100;
  //       payment.status = "pending";
  //       await payment.save({ transaction });
  //       return substitution;
  //     });
  //     return new DataResponseDto(result);
  //   } catch (err) {
  //     if (err instanceof HttpException) throw err;
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }

  async substituteOrder(
    userId: number,
    substitutionId: number,
    productId: UUID
  ) {
    try {
      const result = await this.sequelize.transaction(async (transaction) => {
        let total = 0;
        let quantity = 0;
        
        // Find the pending substitution
        const substitution = await this.repository.findOne({
          where: {
            id: substitutionId,
            status: "pending",
          },
          transaction,
        });
        
        if (!substitution)
          throw new NotFoundException("No substitution is found.");
        
        // Update substitution status
        substitution.status = "accepted";
        substitution.read = true;
        await substitution.save({ transaction });
        
        // Find the original order item
        const orderItem = await OrderItems.findOne({
          where: {
            id: substitution.orderItemId,
          },
          transaction,
        });
        
        if (!orderItem)
          throw new NotFoundException("No Order has been found..");
        
        // Find the substitute product
        const product = await Products.findOne({
          where: { pid: productId },
          transaction,
        });
        
        if (!product)
          throw new NotFoundException("Substitute product not found");
          
        if (product.status == false)
          throw new ServiceUnavailableException("Product is Not Available");
          
        if (product.unit == 0 || product.unit < substitution.substitueQuantity)
          throw new ServiceUnavailableException("Product out of stock");
        
        // Decrease the substitute product's inventory
        await product.decrement("unit", {
          by: Number(substitution.substitueQuantity),
          transaction,
        });

        // Instead of creating a new item, update the existing order item with new product info
        orderItem.productId = product._id;
        orderItem.quantity = substitution?.availableQuantity || substitution?.substitueQuantity;
        orderItem.price = product.retail_rate;
        orderItem.totalPrice = product.retail_rate * orderItem.quantity;
        orderItem.image = product.image;
        orderItem.name = product.name;
        orderItem.sku = product.sku;
        orderItem.barcode = product.bar_code;
        
        await orderItem.save({ transaction });
        
        // Create a status update for the order
        const orderStatus = await OrderStatus.create(
          {
            orderId: substitution.orderId,
            status: "processing",
            remark: `Your Order Substitution is Successful for ${orderItem.name} (${orderItem.quantity} unit)`,
          },
          { transaction }
        );
        
        // Recalculate order totals
        const orderItems = await OrderItems.findAll({
          where: {
            orderId: substitution.orderId,
          },
          transaction,
        });
        
        for (const item of orderItems) {
          total += item?.totalPrice;
          quantity += item?.quantity;
        }
        
        // Update the main order
        const order = await Order.findOne({
          where: {
            id: substitution.orderId,
          },
          transaction,
        });
        
        if (!order) throw new NotFoundException("Order not found");
        
        order.totalItems = quantity;
        order.total = total;
        order.grandTotal = total + order.deliveryCharge + order.tax - order.discount;
        order.status = "processing";
        await order.save({ transaction });

        // Update payment amount
        const payment = await OrderPayments.findOne({
          where: {
            orderId: substitution.orderId,
          },
          transaction,
        });
        
        if (payment) {
          payment.amount = order.grandTotal * 100;
          payment.status = "pending";
          await payment.save({ transaction });
        }
        
        return substitution;
      });
      
      return new DataResponseDto(result);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updateOrder(userId: number, substituteId: number) {
    try {
      const result = await this.sequelize.transaction(async (transaction) => {
        let total = 0;
        let quantity = 0;
        const substitution = await this.repository.findOne({
          where: {
            id: substituteId,
            status: "pending",
          },
          transaction,
        });
        if (!substitution)
          throw new NotFoundException("No substitution is found.");
        substitution.status = "updated";
        substitution.read = true;
        await substitution.save({ transaction });
        const orderItem = await OrderItems.findOne({
          where: {
            id: substitution.orderItemId,
          },
          transaction,
        });
        if (!orderItem)
          throw new NotFoundException("No Order has been found..");
        orderItem.quantity = substitution?.availableQuantity
          ? substitution?.availableQuantity
          : substitution?.substitueQuantity;
        orderItem.totalPrice =
          (substitution?.availableQuantity
            ? substitution?.availableQuantity
            : substitution?.substitueQuantity) * orderItem.price;
        await orderItem.save({ transaction });
        total += orderItem.totalPrice;
        quantity += orderItem.quantity;

        const orderStatus = await OrderStatus.create(
          {
            orderId: substitution.orderId,
            status: orderItem.quantity == 0 ? "cancelled" : "processing",
            remark:
              orderItem.quantity == 0
                ? `Your Order has been cancelled..(${orderItem.name})`
                : `Your Order has been updated (quantity updated to ${orderItem.quantity} unit)`,
          },
          { transaction }
        );
        const orderItems = await OrderItems.findAll({
          where: {
            orderId: substitution.orderId,
            productId: {
              [Op.notIn]: [orderItem.productId],
            },
          },
        });
        for (const item of orderItems) {
          total += item?.totalPrice;
          quantity += item?.quantity;
        }

        const order = await Order.findOne({
          where: {
            id: substitution.orderId,
          },
          transaction,
        });
        if (!order) throw new NotFoundException();
        order.totalItems = quantity;
        order.total = total;
        order.grandTotal =
          total + order.deliveryCharge + order.tax - order.discount;
        order.status = orderItem.quantity == 0 ? "cancelled" : "processing";
        await order.save({ transaction });
        const payment = await OrderPayments.findOne({
          where: {
            orderId: substitution.orderId,
          },
        });
        payment.amount = order.grandTotal * 100;
        payment.status = "pending";
        await payment.save({ transaction });
        return substitution;
      });
      return new DataResponseDto(result);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async afterCommit(
    t: Transaction,
    data: any,
    newOrder: any,
    store: Store,
    orderItems: any,
    address: any,
    substitutedProduct: any
  ) {
    try {
      const user = await newOrder.getUserDetails({
        row: true,
        attributes: ["name", "email", "fcmtoken"],
      });
      t.afterCommit(async () => {
        await this.notificationService.createNotification(
          "order substitution",
          "You have a new order substitution request ",
          "New Order Substitution",
          newOrder.order_id,
          newOrder.userId,
          orderItems[0]?.image,
          user?.fcmtoken
        );
        await this.notificationService.sendPushNotification({
          to: user?.fcmtoken,
          message: `A substitution is needed for order #${newOrder?.order_id}. Please review and approve the suggested alternatives.`,
          title: `Order Substitution Request for #${newOrder?.order_id}`,
        });
        const datass = {
          user: user,
          order: newOrder,
          store: store,
          address: address,
          originalProduct: orderItems,
          substitutedProducts: substitutedProduct,
        };
        let userMail = await ToUserOrderSubstitution(datass);
        this.mailService.sellerEmails(userMail);
      });
    } catch (err) {
      console.log('error',err)
      return null;
    }
  }
}
