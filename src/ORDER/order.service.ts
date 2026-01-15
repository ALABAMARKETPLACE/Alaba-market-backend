import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Order } from "./order.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { OrderStatusService } from "../ORDER_STATUS/order_status.service";
import { Op, Sequelize, Transaction, ValidationError, where } from "sequelize";
import { OrderItems } from "../ORDER_ITEMS/order_items.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { MailService } from "../MAILS/Mails.services";
import { OrderUpdateMail } from "../MAILS/templates/orders/order_Status_update";
import { UpdateOrderStatus } from "./dto/updateOrderStatus.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { OrderSearchStoreDto } from "./dto/order_search_store.dto";
import { CancelOrderDto } from "./dto/cancelorder.dto";
import { orderCancelMail } from "../MAILS/templates/orders/order_cancelled_user";
import { orderCancelSellerMail } from "../MAILS/templates/orders/order_cancelled_seller";
import { PageOptionsGetOrdersDto } from "./dto/getOrders.dto";
import { StoreReview } from "../STORE_REVIEW/storereview.entity";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { Products } from "../PRODUCTS/products.entity";
import { NotificationsService } from "../NOTIFICATIONS/notification.service";
import { User } from "../USERS/user.entity";
import { OrderSubstitution } from "../ORDER_SUBSTITUTION/substitution.entity";
import { Role } from "../shared/enum/role.enum";
import { RefundRequest } from "../REFUND_REQUEST/refund-request.entity";
import { PaymentGateWayService } from "../PAYMENT_GATEWAY/payment_gateway.service";

@Injectable()
export class OrderService {
  constructor(
    @Inject("OrderRepository")
    private readonly OrderRepository: typeof Order,
    private readonly orderStatusService: OrderStatusService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationsService,
    private readonly paymentGateWayService: PaymentGateWayService
  ) {}

  includeModals: any[] = [
    {
      model: OrderStatus,
      required: true,
      attributes: { exclude: ["id", "orderId"] },
      order: [["updatedAt", "ASC"]],
    },
    {
      model: OrderPayments,
      required: false,
      attributes: {
        exclude: ["id", "orderId", "createdAt", "updatedAt"],
      },
    },
    {
      model: StoreReview,
      required: false,
      attributes: ["rating", "remark", "id"],
    },
    {
      model: OrderItems,
      required: true,
      attributes: { exclude: [] },
      include: [
        {
          model: Products,
          required: false,
          as: "productDetails",
          attributes: ["subCategory"],
        },
      ],
    },
    {
      model: OrderSubstitution,
      required: false,
      where: {
        status: "pending",
      },
    },
  ];

  orderAttributes: any = {
    exclude: ["userId", "addressId", "storeId"],
    include: [
      [
        Sequelize.literal(
          `(SELECT "store_name" FROM "STORE" WHERE "STORE"."id" = "Order"."storeId")`
        ),
        "store_name",
      ],
      [
        Sequelize.literal(
          `(SELECT "orderId" FROM "STORE_REVIEW" WHERE "STORE_REVIEW"."orderId" = "id")`
        ),
        "available",
      ],
      [
        Sequelize.literal(
          `CASE WHEN 
            NOT EXISTS (SELECT "orderId" FROM "STORE_REVIEW" WHERE "STORE_REVIEW"."orderId" = "Order"."id") 
            AND "Order"."status" = 'delivered' 
            THEN TRUE ELSE FALSE 
          END`
        ),
        "review",
      ],
    ],
  };

  //for user only
  async findOne(userId: number, order_id: number) {
    try {
      const order = await this.OrderRepository.findOne({
        where: {
          order_id,
          userId,
        },
        attributes: this.orderAttributes,
        include: this.includeModals,
        order: [[Sequelize.col("orderStatus.createdAt"), "ASC"]],
      });
      if (!order) throw new NotFoundException();
      return new DataResponseDto(order, true, "Successfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  //for seller
  async findOneForSeller(storeId: number, order_id: number) {
    try {
      const order = await this.OrderRepository.findOne({
        where: {
          order_id,
          storeId,
        },
        attributes: this.orderAttributes,
        include: this.includeModals,
        order: [[Sequelize.col("orderStatus.createdAt"), "ASC"]],
      });
        if (!order) throw new NotFoundException();
      return new DataResponseDto(order, true, "Successfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  //for admin and seller
  async findOrder(order_id: number, role: string, storeId: number) {
    try {
      const order = await this.OrderRepository.findOne({
        where: {
          ...(role != Role.Admin && { storeId }),
          order_id,
        },
        attributes: this.orderAttributes,
        include: this.includeModals,
        order: [[Sequelize.col("orderStatus.createdAt"), "ASC"]],
      });
      if (!order) throw new NotFoundException();
      return new DataResponseDto(order, true, "Successfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findAll(userId: number, pageOptionsDto: PageOptionsGetOrdersDto) {
    const { sort, offset, limit } = pageOptionsDto;
    const getDate = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return date;
    };
    const startOfYear = new Date(2023, 0, 1);
    const endOfYear = new Date(2023, 11, 31, 23, 59, 59, 999);
    const filterBydate = {
      ["30days"]: { [Op.gte]: getDate(30) },
      ["3months"]: { [Op.gte]: getDate(90) },
      ["6months"]: { [Op.gte]: getDate(180) },
      ["2023"]: { [Op.between]: [startOfYear, endOfYear] },
    };
    try {
      const { status, name } = pageOptionsDto;
      const { rows, count } = await this.OrderRepository.findAndCountAll<Order>(
        {
          order: [["createdAt", pageOptionsDto.order]],
          limit,
          offset,
          distinct: true,
          where: {
            userId,
            ...(status && { status }),
            ...(sort &&
              sort in filterBydate && { createdAt: filterBydate[sort] }),
          },
          attributes: [
            "id",
            "userId",
            "storeId",
            "totalItems",
            "total",
            "discount",
            "grandTotal",
            "status",
            "createdAt",
            "order_id",
            "products",
          ],
          include: [
            {
              model: OrderItems,
              required: true,
              attributes: {
                exclude: [
                  "orderId",
                  "sku",
                  "barcode",
                  "createdAt",
                  "updatedAt",
                  "id",
                  "productId",
                  "variantId",
                ],
              },
              where: {
                ...(name && { name: { [Op.iLike]: `%${name?.trim()}%` } }),
              },
            },
            { model: User, required: true, attributes: ["name"] },
          ],
        }
      );
      return new DataResponseDto(rows, true, "Success", pageOptionsDto, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOrderByStore(storeId: number | undefined, pageOptionsDto: OrderSearchStoreDto) {
    const { from, to, status, orderId, offset, limit } = pageOptionsDto;
    try {
      let dateFilter: any = null;
      if (from && to) {
        const startDate = new Date(from);
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        dateFilter = {
          createdAt: {
            [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
          },
        };
      }

      const whereConditions: any = {
        ...(storeId && { storeId }), // Only filter by storeId if provided (seller), otherwise show ALL (admin)
        ...(status && { status }),
        ...(orderId && { order_id: orderId }),
        ...(dateFilter && dateFilter),
      };

      const { rows, count } = await this.OrderRepository.findAndCountAll({
        attributes: [
          'id',
          'order_id',
          'status',
          'grandTotal',
          'total',
          'totalItems',
          'paymentType',
          'deliveryCharge',
          'tax',
          'discount',
          'delivery_date',
          'storeId',
          'userId',
          'delivery_company_id',
          'createdAt',
          [
            Sequelize.literal(`(
              SELECT "image"
              FROM "ORDER_ITEMS" AS "orderItems"
              WHERE "orderItems"."orderId" = "Order"."id"
              LIMIT 1
            )`),
            "image",
          ],
          [
            Sequelize.literal(`(
              SELECT "name"
              FROM "USER" AS "user"
              WHERE "user"."_id" = "Order"."userId"
              LIMIT 1
            )`),
            "name",
          ],
        ],
        where: whereConditions,
        order: [["createdAt", pageOptionsDto.order]],
        limit,
        offset,
      });

      return new DataResponseDto(rows, true, "Success", pageOptionsDto, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // async updateOrder(
  //   storeId: number,
  //   order_id: number,
  //   data: UpdateOrderStatus
  // ) {
  //   try {
  //     const result = await this.OrderRepository.sequelize.transaction(
  //       async (transaction: Transaction) => {
  //         const order: any = await this.OrderRepository.findOne({
  //           where: {
  //             storeId,
  //             id: order_id,
  //           },
  //           transaction,
  //         });
  //         if (!order) throw new NotFoundException();
  //         const terminalStatuses = [
  //           "failed",
  //           "delivered",
  //           "cancelled",
  //           "rejected",
  //         ];
  //         if (terminalStatuses.includes(order?.status)) {
  //           return new DataResponseDto(
  //             {},
  //             true,
  //             `Cannot update order with '${order?.status}' status`
  //           );
  //         }
  //         order.status = data.status;
  //         if (data?.delivery_date) {
  //           order.delivery_date = data?.delivery_date;
  //         }
  //         await order.save({ transaction });
  //         if (order.paymentType == "Pay On Credit") {
  //           const paymentInfo = await order.getOrderPayment({ transaction });
  //           if (paymentInfo.status == "pending") {
  //             await paymentInfo.update({ status: "approved" }, { transaction });
  //           }
  //         }
  //         if (data.status == "delivered") {
  //           const paymentInfo = await order.getOrderPayment({ transaction });
  //           await paymentInfo.update({ status: "success" }, { transaction });
  //           await this.notificationService.createNotification(
  //             "order",
  //             `Your Order has been Delivered. Thank your for shopping with ${process.env.NAME}`,
  //             "Order Delivered",
  //             order.order_id,
  //             order.userId
  //           );
  //         }

  //         await this.orderStatusService.create(
  //           order,
  //           data.remark ?? null,
  //           transaction
  //         );
  //         transaction.afterCommit(async () => {
  //           const user = await order.getUserDetails();
  //           const store = await order.getStoreDetails();

  //           let email = await OrderUpdateMail(
  //             order,
  //             user,
  //             store,
  //             order.products,
  //             order.address
  //           );
  //           this.mailService.sellerEmails(email);
  //         });
  //         return order;
  //       }
  //     );
  //     return new DataResponseDto(result, true, "Succcessfully Updated");
  //   } catch (err) {
  //     if (err instanceof HttpException) throw err;
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }

  async updateOrder(
  id: number,
  data: UpdateOrderStatus
  ) {
    try {
      const result = await this.OrderRepository.sequelize.transaction(
        async (transaction: Transaction) => {

          // Find order by DB PRIMARY KEY (id)
          const order: any = await this.OrderRepository.findByPk(id, {
            transaction,
          });

          if (!order) {
            throw new NotFoundException("Order not found");
          }

          // Block terminal statuses
          const terminalStatuses = [
            "failed",
            "delivered",
            "cancelled",
            "rejected",
          ];

          if (terminalStatuses.includes(order.status)) {
            throw new BadRequestException(
              `Cannot update order with '${order.status}' status`
            );
          }

          //Update order fields
          order.status = data.status;

          if (data?.delivery_date) {
            order.delivery_date = data.delivery_date;
          }

          await order.save({ transaction });

          //Handle Pay On Credit approval
          if (order.paymentType === "Pay On Credit") {
            const paymentInfo = await order.getOrderPayment({ transaction });

            if (paymentInfo && paymentInfo.status === "pending") {
              await paymentInfo.update(
                { status: "approved" },
                { transaction }
              );
            }
          }

          //Handle delivery success logic
          if (data.status === "delivered") {
            const paymentInfo = await order.getOrderPayment({ transaction });

            if (paymentInfo) {
              await paymentInfo.update(
                { status: "success" },
                { transaction }
              );
            }

            await this.notificationService.createNotification(
              "order",
              `Your order has been delivered. Thank you for shopping with ${process.env.NAME}`,
              "Order Delivered",
              order.order_id, // business ID is fine for notifications
              order.userId
            );
          }

          //Save order status history
          await this.orderStatusService.create(
            order,
            data.remark ?? null,
            transaction
          );

          //Post-commit side effects (email)
          transaction.afterCommit(async () => {
            try {
              const user = await order.getUserDetails();
              const store = await order.getStoreDetails();

              const email = await OrderUpdateMail(
                order,
                user,
                store,
                order.products,
                order.address
              );

              await this.mailService.sellerEmails(email);
            } catch (err) {
              //Never crash the app after commit
              console.error("Order update email failed:", err);
            }
          });

          return order;
        }
      );

      return new DataResponseDto(result, true, "Successfully Updated");

    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }


  async cancelOrder(userId: number, id: number, data: CancelOrderDto) {
    try {
      const result = await this.OrderRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const order: any = await this.OrderRepository.findOne({
            where: {
              id,
              userId,
            },
            transaction,
          });
          const store = await order.getStoreDetails();

          if (!order) throw new NotFoundException();
          if (order.status == "cancelled")
            throw new Error("Order has been cancelled already@@");
          if (order.status == "waiting_refund")
            throw new Error(
              "Order has already been cancelled and is awaiting refund approval."
            );
          if (order.status != "pending" && order.status != "substitution")
            throw new Error("You can't Cancel this order@@");

          if (!store.auto_approve_refund) {
            RefundRequest.create(
              {
                order_id: order.id,
                customer_id: order.userId,
                store_id: order.storeId,
                refund_amount: order.grandTotal,
                status: "waiting_refund",
                is_auto_approved: store.auto_approve,
                reason: data.remark,
                refund_processed_date: new Date(),
              },
              { transaction }
            );
          } else {
            RefundRequest.create(
              {
                order_id: order.id,
                customer_id: order.userId,
                store_id: order.storeId,
                refund_amount: order.grandTotal,
                status: "approved",
                is_auto_approved: store.auto_approve,
                reason: data.remark,
                refund_processed_date: new Date(),
              },
              { transaction }
            );
          }

          order.status = !store.auto_approve_refund
            ? "waiting_refund"
            : "cancelled";
          await order.save({ transaction });
          await order.createOrderStatus(
            {
              orderId: order.id,
              status: !store.auto_approve_refund
                ? "waiting_refund"
                : "cancelled",
              remark: data.remark,
            },
            transaction
          );
          await OrderSubstitution.update(
            {
              status: !store.auto_approve_refund
                ? "waiting_refund"
                : "cancelled",
            },
            {
              where: {
                orderId: id,
              },
              transaction,
            }
          );
          await OrderStatus.create(
            {
              orderId: id,
              status: !store.auto_approve_refund
                ? "waiting_refund"
                : "cancelled",
              remark: data.remark,
            },
            { transaction }
          );
          if (!store.auto_approve_refund) {
            transaction.afterCommit(async () => {
              const user = await order.getUserDetails();
              let email = await orderCancelMail(
                order,
                user,
                store,
                order.products
              );
              let sellerEmail = await orderCancelSellerMail(
                order,
                user,
                store,
                order.products,
                data.remark
              );
              this.mailService.sellerEmails(email);
              this.mailService.sellerEmails(sellerEmail);
            });
          }
          const updatedSubstition = await OrderSubstitution.update(
            { read: true },
            {
              where: {
                orderId: id,
              },
              transaction: transaction,
            }
          );
          return order;
        }
      );
      return new DataResponseDto(result, true, "Order Cancelled Successfully.");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // async getStoreOrders(storeId: number) {
  //   try {
  //     const attributes: any[] = [
  //       "pending",
  //       "cancelled",
  //       "shipped",
  //       "out_for_delivery",
  //       "packed",
  //       "delivered",
  //       "rejected",
  //       "processing",
  //       "failed",
  //     ].map((item) => [
  //       Sequelize.fn(
  //         "count",
  //         Sequelize.literal(`CASE WHEN status = '${item}' THEN 1 ELSE null END`)
  //       ),
  //       `${item}Orders`,
  //     ]);
  //     const order = await this.OrderRepository.findOne({
  //       where: {
  //         storeId,
  //       },
  //       attributes: [
  //         ...attributes,
  //         [Sequelize.fn("count", "*"), "totalOrders"],
  //       ],
  //     });
  //     return new DataResponseDto(order, true, "Succesfull");
  //   } catch (err) {
  //     if (err instanceof HttpException) throw err;
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }

  async getStoreOrders(storeId: number) {
    try {
      const orders = await this.OrderRepository.findAll({
        where: {
          storeId,
        },
        order: [["createdAt", "DESC"]],
      });

      return new DataResponseDto(orders, true, "Successful");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async completePayment(storeId: number, orderId: number) {
    try {
      const [status, updated] = await OrderPayments.update(
        { status: "success" },
        { where: { orderId }, returning: true }
      );
      if (status == 0) throw new NotFoundException();
      return new DataResponseDto(updated, true, "Success");
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async buyAgain(userid: number, pageOptionsDto: PageOptionsDto) {
    try {
      const { take, page, order } = pageOptionsDto;
      const { count, rows } = await OrderItems.findAndCountAll({
        attributes: { include: [[Sequelize.col("productDetails.pid"), "pid"]] },
        offset: (page - 1) * take,
        limit: take,
        order: [["createdAt", "DESC"]],
        where: {},
        include: [
          {
            model: Order,
            attributes: [],
            required: true,
            where: {
              userId: userid,
            },
          },
          { model: Products, required: true, attributes: [] },
        ],
      });
      return new DataResponseDto(rows, true, "Success", pageOptionsDto, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
