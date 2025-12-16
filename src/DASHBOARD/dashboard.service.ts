import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { User } from "../USERS/user.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Store } from "../STORE/store.entity";
import { Products } from "../PRODUCTS/products.entity";
import { Order } from "../ORDER/order.entity";
import { Op, Sequelize } from "sequelize";
import { Role } from "../shared/enum/role.enum";
import { OrderStatisticsDto } from "./dto/statistics.dto";

@Injectable()
export class DashboardService {
  constructor(
    @Inject("userRepository")
    private readonly userRepository: typeof User,
    @Inject("storeRepository")
    private readonly storeRepository: typeof Store,
    @Inject("productsRepository")
    private readonly productsRepository: typeof Products,
    @Inject("orderRepository")
    private readonly orderRepository: typeof Order
  ) {}

  async getCount(storeId: number, role: string) {
    const where1 = { ...(role !== Role.Admin && { store_id: storeId }) };
    const where2 = { ...(role !== Role.Admin && { storeId }) };
    try {
      const response: any = {};
      response.productsCount = await this.productsRepository.count({
        where: where1,
      });
      response.orderCount = await this.orderRepository.count({ where: where2 });
      if (role == Role.Seller) return new DataResponseDto(response);
      response.userCount = await this.userRepository.count();
      response.sellerCount = await this.storeRepository.count();
      return new DataResponseDto(response);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async getStatistics(storeId: number, role: string) {
    try {
      const orderStatistics = await this.orderRepository.findAll({
        attributes: [
          [
            Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt")),
            "orderDate",
          ],
          [Sequelize.fn("count", "*"), "orderCount"],
          [Sequelize.fn("sum", Sequelize.col("grandTotal")), "total"],
        ],
        group: [Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt"))],
        limit: 7,
        order: [["orderDate", "DESC"]],
        where: {
          ...(role != Role.Admin && { storeId }),
        },
      });
      return new DataResponseDto({
        orderStatistics: orderStatistics?.reverse(),
      });
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async getOrderStatistics(
    storeId: number,
    role: string,
    { date }: OrderStatisticsDto
  ) {
    try {
      const startOfDay = date ? new Date(date) : new Date();
      startOfDay.setHours(0, 0, 0, 0); // Sets to 00:00:00.000 of today
      const endOfDay = date ? new Date(date) : new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const where = {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
        ...(role != Role.Admin && { storeId }),
      };

      const orderStatus = [
        "pending",
        "cancelled",
        "shipped",
        "out_for_delivery",
        "packed",
        "delivered",
        "rejected",
        "processing",
        "failed",
        "substitution",
      ];
      const attributes: any[] = orderStatus.map((item) => [
        Sequelize.fn(
          "count",
          Sequelize.literal(`CASE WHEN status = '${item}' THEN 1 ELSE null END`)
        ),
        `${item
          ?.toLowerCase()
          .replace(/_/g, " ")
          .replace(/(?:^|\s)\S/g, (match) => match.toUpperCase())} Orders`,
      ]);
      const orderStatistics = await Order.findOne({
        attributes,
        where,
        raw: true,
      });
      const totalOrders = await this.orderRepository.count({ where });
      return new DataResponseDto({ orderStatistics, totalOrders });
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}
