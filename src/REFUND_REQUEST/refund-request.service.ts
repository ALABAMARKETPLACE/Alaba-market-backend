import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Op, Transaction } from "sequelize";
import { orderCancelSellerMail } from "../MAILS/templates/orders/order_cancelled_seller";
import { orderCancelMail } from "../MAILS/templates/orders/order_cancelled_user";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { OrderSubstitution } from "../ORDER_SUBSTITUTION/substitution.entity";
import { MailService } from "../MAILS/Mails.services";
import { Order } from "../ORDER/order.entity";
import { Store } from "../STORE/store.entity";
import { User } from "../USERS/user.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { RefundRequestSearchPaginationDto } from "./dto/refund-request-search.dto";
import { UpdateRefundRequestDto } from "./dto/update-refund-request.dto";
import { RefundRequest } from "./refund-request.entity";
import { OrderItems } from "../ORDER_ITEMS/order_items.entity";
import { StoreReview } from "../STORE_REVIEW/storereview.entity";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";

@Injectable()
export class RefundRequestService {
  constructor(
    @Inject("RefundRequestRepository")
    private readonly RefundRequestRepository: typeof RefundRequest,
    private readonly mailService: MailService
  ) {}

  async findAll(
    pageOptionsDto: RefundRequestSearchPaginationDto,
    storeId?: number
  ) {
    const { order_id, status, customer_name, from_date, to_date } =
      pageOptionsDto;
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.take;
    try {
      // Build WHERE clause
      const whereClause = {
        [Op.and]: [
          {
            ...(storeId && { store_id: storeId }),
          },
          {
            ...(order_id && { order_id: order_id }),
          },
          {
            ...(status && { status: status }),
          },
          // Add date range filtering
          ...(from_date || to_date
            ? [
                {
                  createdAt: {
                    ...(from_date && { [Op.gte]: new Date(from_date) }),
                    ...(to_date && { [Op.lte]: new Date(to_date) }),
                  },
                },
              ]
            : []),
        ],
      };

      // Include options with customer name filter
      const includeOptions = [
        {
          model: User,
          as: "customer",
          ...(customer_name && {
            where: {
              username: { [Op.iLike]: `%${customer_name}%` },
            },
          }),
        },
        {
          model: Order,
          as: "order",
          include: [
            {
              model: OrderStatus,
              required: true,
            },
            {
              model: OrderPayments,
              required: false,
            },
            {
              model: StoreReview,
              required: false,
            },
            {
              model: OrderItems,
              required: true,
            },
            {
              model: OrderSubstitution,
              required: false,
            },
          ],
        },
        {
          model: Store,
          as: "store",
        },
      ];

      const { rows, count } =
        await this.RefundRequestRepository.findAndCountAll({
          order: [["createdAt", "DESC"]],
          limit: pageOptionsDto.take,
          offset: skip,
          where: whereClause,
          include: includeOptions,
          distinct: true,
          col: "id",
        });
      return new DataResponseDto(rows, true, "Success", pageOptionsDto, count);
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOne(id: number) {
    try {
      const refundRequest = await this.RefundRequestRepository.findByPk(id, {
        include: [
          {
            model: User,
            as: "customer",
          },
          {
            model: Order,
            as: "order",
            include: [
              {
                model: OrderStatus,
                required: true,
              },
              {
                model: OrderPayments,
                required: false,
              },
              {
                model: StoreReview,
                required: false,
              },
              {
                model: OrderItems,
                required: true,
              },
              {
                model: OrderSubstitution,
                required: false,
              },
            ],
          },
          {
            model: Store,
            as: "store",
          },
        ],
      });
      if (!refundRequest)
        throw new NotFoundException("Refund request not found");
      return new DataResponseDto(refundRequest, true, "Successfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async adminApprove(id: number, data: UpdateRefundRequestDto) {
    try {
      const result = await this.RefundRequestRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const refundRequest: any =
            await this.RefundRequestRepository.findByPk(id, {
              include: [
                {
                  model: User,
                  as: "customer",
                },
                {
                  model: Order,
                  as: "order",
                },
              ],
              transaction,
            });

          if (!refundRequest) {
            throw new NotFoundException("Refund request not found");
          }

          if (refundRequest.status !== "waiting_refund") {
            throw new HttpException(
              "This refund request cannot be updated as it is not in waiting status",
              HttpStatus.BAD_REQUEST
            );
          }

          refundRequest.status = "approved";
          refundRequest.admin_note = data.admin_note;

          // If approved, update the order status
          const order: any = await Order.findOne({
            where: {
              id: refundRequest.order_id,
            },
            transaction,
          });

          if (order) {
            order.status = "cancelled";
            await order.save({ transaction });
          }

          await OrderSubstitution.update(
            { status: "cancelled" },
            {
              where: {
                orderId: id,
              },
              transaction,
            }
          );
          await OrderStatus.create(
            {
              orderId: order.id,
              status: "cancelled",
            },
            { transaction }
          );
          const store = await order.getStoreDetails();
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
              refundRequest.remark
            );
            this.mailService.sellerEmails(email);
            this.mailService.sellerEmails(sellerEmail);
          });

          const updated = await refundRequest.save({ transaction });
          return updated;
        }
      );

      return new DataResponseDto(
        result,
        true,
        `Refund request ${result.status} successfully`
      );
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
