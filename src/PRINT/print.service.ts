import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Op, Sequelize, Transaction } from "sequelize";
import { PrintItems } from "../PRINT_ITEMS/print_items.entity";
import { MailService } from "../MAILS/Mails.services";
import { OrderUpdateMail } from "../MAILS/templates/orders/order_Status_update";
import { orderCancelSellerMail } from "../MAILS/templates/orders/order_cancelled_seller";
import { orderCancelMail } from "../MAILS/templates/orders/order_cancelled_user";
import { NotificationsService } from "../NOTIFICATIONS/notification.service";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { OrderStatusService } from "../ORDER_STATUS/order_status.service";
import { OrderSubstitution } from "../ORDER_SUBSTITUTION/substitution.entity";
import { Products } from "../PRODUCTS/products.entity";
import { RefundRequest } from "../REFUND_REQUEST/refund-request.entity";
import { StoreReview } from "../STORE_REVIEW/storereview.entity";
import { User } from "../USERS/user.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { Role } from "../shared/enum/role.enum";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { CancelPrintDto } from "./dto/cancel_print.dto";
import { PageOptionsGetPrintDto } from "./dto/getPrints.dto";
import { PrintSearchStoreDto } from "./dto/print_search_store.dto";
import { UpdatePrintStatus } from "./dto/update_print_status.dto";
import { Print } from "./print.entity";
import { PrintStatus } from "../PRINT_STATUS/print_status.entity";
import { PrintStatusService } from "../PRINT_STATUS/print_status.service";
import { PrintConfigeration } from "../PRINT_CONFIGERATION/print_configeration.entity";

@Injectable()
export class PrintService {
  constructor(
    @Inject("PrintRepository")
    private readonly PrintRepository: typeof Print,
    private readonly orderStatusService: PrintStatusService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationsService
  ) {}

  includeModals: any[] = [
    {
      model: PrintStatus,
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
    // {
    //   model: StoreReview,
    //   required: false,
    //   attributes: ["rating", "remark", "id"],
    // },
    {
      model: PrintItems,
      required: true,
      attributes: { exclude: [] },
      include: [
        {
          model: PrintConfigeration,
          attributes: ["printType", "printColor", "doublesided"],
        },
      ],
    },
  ];

  orderAttributes: any = {
    exclude: ["userId", "addressId", "storeId"],
    include: [
      [
        Sequelize.literal(
          `(SELECT "store_name" FROM "STORE" WHERE "STORE"."id" = "Print"."storeId")`
        ),
        "store_name",
      ],
    ],
  };

  //for user only
  async findOne(userId: number, print_id: number) {
    try {
      const order = await this.PrintRepository.findOne({
        where: {
          print_id,
          userId,
        },
        attributes: this.orderAttributes,
        include: this.includeModals,
        order: [[Sequelize.col("printStatus.createdAt"), "ASC"]],
      });
      if (!order) throw new NotFoundException();
      return new DataResponseDto(order, true, "Successfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  //for seller
  async findOneForSeller(storeId: number, print_id: number) {
    try {
      const order = await this.PrintRepository.findOne({
        where: {
          print_id,
          storeId,
        },
        attributes: this.orderAttributes,
        include: this.includeModals,
        order: [[Sequelize.col("printStatus.createdAt"), "ASC"]],
      });
      if (!order) if (!order) throw new NotFoundException();
      return new DataResponseDto(order, true, "Successfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  //for admin and seller
  async findOrder(print_id: number, role: string, storeId: number) {
    try {
      const order = await this.PrintRepository.findOne({
        where: {
          ...(role != Role.Admin && { storeId }),
          print_id,
        },
        attributes: this.orderAttributes,
        include: this.includeModals,
        order: [[Sequelize.col("printStatus.createdAt"), "ASC"]],
      });
      if (!order) throw new NotFoundException();
      return new DataResponseDto(order, true, "Successfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findAll(userId: number, pageOptionsDto: PageOptionsGetPrintDto) {
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
      const { rows, count } = await this.PrintRepository.findAndCountAll<Print>(
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
            "print_id",
            "products",
          ],
          include: [
            {
              model: PrintItems,
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

  async findOrderByStore(storeId: number, pageOptionsDto: PrintSearchStoreDto) {
    const { from, to, status, orderId, offset, limit } = pageOptionsDto;
    try {
      const { rows, count } = await this.PrintRepository.findAndCountAll({
        attributes: {
          include: [
            [Sequelize.col("userDetails.name"), "name"],
            [
              Sequelize.literal(`(
              SELECT "image"
              FROM "PRINT_ITEMS" AS "printItems"
              WHERE "printItems"."printId" = "Print"."id"
              LIMIT 1
            )`),
              "image",
            ],
          ],
          exclude: [
            "address",
            "products",
            "updatedAt",
            "addressId",
            "storeId",
            "userId",
          ],
        },
        where: {
          storeId,
          ...(status && { status }),
          ...(orderId && { print_id: orderId }),
          ...(from &&
            to && {
              createdAt: {
                [Op.and]: [
                  { [Op.gte]: new Date(from) },
                  { [Op.lte]: new Date(to).setHours(23, 59, 59, 999) },
                ],
              },
            }),
        },
        order: [["createdAt", pageOptionsDto.order]],
        limit,
        offset,
        include: [{ model: User, required: true, attributes: [] }],
      });
      return new DataResponseDto(rows, true, "Success", pageOptionsDto, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updateOrder(
    storeId: number,
    print_id: number,
    data: UpdatePrintStatus
  ) {
    try {
      const result = await this.PrintRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const order: any = await this.PrintRepository.findOne({
            where: {
              storeId,
              id: print_id,
            },
            transaction,
          });
          if (!order) throw new NotFoundException();
          const terminalStatuses = [
            "failed",
            "delivered",
            "cancelled",
            "rejected",
          ];
          if (terminalStatuses.includes(order?.status)) {
            return new DataResponseDto(
              {},
              true,
              `Cannot update print with '${order?.status}' status`
            );
          }
          order.status = data.status;
          if (data?.delivery_date) {
            order.delivery_date = data?.delivery_date;
          }
          await order.save({ transaction });
          if (order.paymentType == "Pay On Credit") {
            const paymentInfo = await order.getOrderPayment({ transaction });
            if (paymentInfo.status == "pending") {
              await paymentInfo.update({ status: "approved" }, { transaction });
            }
          }
          if (data.status == "delivered") {
            const paymentInfo = await order.getOrderPayment({ transaction });
            await paymentInfo.update({ status: "success" }, { transaction });
            await this.notificationService.createNotification(
              "order",
              `Your Order has been Delivered. Thank your for shopping with ${process.env.NAME}`,
              "Order Delivered",
              order.print_id,
              order.userId
            );
          }

          await this.orderStatusService.create(
            order,
            data.remark ?? null,
            transaction
          );
          transaction.afterCommit(async () => {
            const user = await order.getUserDetails();
            const store = await order.getStoreDetails();

            let email = await OrderUpdateMail(
              order,
              user,
              store,
              order.products,
              order.address
            );
            this.mailService.sellerEmails(email);
          });
          return order;
        }
      );
      return new DataResponseDto(result, true, "Succcessfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async cancelOrder(userId: number, id: number, data: CancelPrintDto) {
    try {
      const result = await this.PrintRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const order: any = await this.PrintRepository.findOne({
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
          return order;
        }
      );
      return new DataResponseDto(result, true, "Order Cancelled Successfully.");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getStoreOrders(storeId: number) {
    try {
      const attributes: any[] = [
        "pending",
        "cancelled",
        "shipped",
        "out_for_delivery",
        "packed",
        "delivered",
        "rejected",
        "processing",
        "failed",
      ].map((item) => [
        Sequelize.fn(
          "count",
          Sequelize.literal(`CASE WHEN status = '${item}' THEN 1 ELSE null END`)
        ),
        `${item}Orders`,
      ]);
      const order = await this.PrintRepository.findOne({
        where: {
          storeId,
        },
        attributes: [
          ...attributes,
          [Sequelize.fn("count", "*"), "totalOrders"],
        ],
      });
      return new DataResponseDto(order, true, "Succesfull");
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
      const { count, rows } = await PrintItems.findAndCountAll({
        attributes: { include: [[Sequelize.col("productDetails.pid"), "pid"]] },
        offset: (page - 1) * take,
        limit: take,
        order: [["createdAt", "DESC"]],
        where: {},
        include: [
          {
            model: Print,
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
