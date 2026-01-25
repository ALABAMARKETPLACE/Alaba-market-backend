import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { Op, Sequelize, Transaction } from "sequelize";
import { Order } from "../ORDER/order.entity";
import { Products } from "../PRODUCTS/products.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { CreateSettlementsDto } from "./dto/createSettlements.dto";
import { SettlementsQueryDto } from "./dto/queryDto.dto";
import { Settlements } from "./settlements.entity";
import { Store } from "../STORE/store.entity";
import { UserBankAccount } from "../USER_BANK_ACCOUNTS/user_bank_accounts.entity";
import { Role } from "../shared/enum/role.enum";
@Injectable()
export class SettlementsService {
  constructor(
    @Inject("SettlementsRepository")
    private readonly SettlementsRepository: typeof Settlements,
    @Inject("ProductsRepository")
    private readonly ProductsRepository: typeof Products
  ) {}

  async findAll(user: any, pageOptions: SettlementsQueryDto) {
    try {
      const { offset, limit, settle_status } = pageOptions;

      // Build WHERE dynamically
      const where: any = {};

      // Seller → restrict to their store
      if (user?.role === Role.Seller) {
        if (!user.storeId) {
          throw new BadRequestException("Seller has no store assigned");
        }
        where.storeId = user.storeId;
      }

      // Optional status filter
      if (settle_status) {
        where.status = settle_status;
      }

      const { rows, count } =
        await this.SettlementsRepository.findAndCountAll({
          limit,
          offset,
          order: [["updatedAt", "DESC"]],
          where,
          include: [
            { model: Store, attributes: ["store_name"] },
            {
              model: UserBankAccount,
              required: false,
            },
          ],
        });

      return new DataResponseDto(rows, true, "Success", pageOptions, count);
    } catch (err) {
      console.error("[SettlementsService.findAll] Error:", err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOneById(id: number): Promise<DataResponseDto> {
    try {
      const data = await this.SettlementsRepository.findOne({
        where: {
          id,
        },
        order: [["updatedAt", "DESC"]],
        include: [
          { model: Store },
          {
            model: UserBankAccount,
            required: false,
          },
        ],
      });

      if (!data) {
        return new DataResponseDto(
          [],
          false,
          `No settlement found with id ${id}`
        );
      }

      return new DataResponseDto(data, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findAllSettlement(
    storeId: number,
    pageOptions: SettlementsQueryDto,
    type: string
  ) {
    try {
      const { offset, limit, settle_status } = pageOptions;
      const result = await this.SettlementsRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const whereClause: any = {
            ...(settle_status && { status: settle_status }),
          };

          if (type === "store") {
            whereClause.storeId = storeId;
          }

          const datas = await this.SettlementsRepository.findAndCountAll({
            limit,
            offset,
            order: [["updatedAt", "DESC"]],
            where: whereClause,
            transaction,
            include: [
              { model: Store, attributes: ["store_name"] },
              {
                model: UserBankAccount,
                attributes: ["accountHolderName", "accountNumber"],
              },
            ],
          });

          return datas;
        }
      );

      const { rows, count } = result;
      return new DataResponseDto(rows, true, "Success", pageOptions, count);
    } catch (err) {
      console.log("err-->>");
      console.log(err);
      console.log("err-->>");
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // async findSummary(params: { storeId?: number }) {
  //   try {
  //     const orderWhere: any = { status: "delivered" };
  //     const settlementWhereSuccess: any = { status: "success" };
  //     const settlementWherePending: any = {
  //       status: { [Op.notIn]: ["success"] },
  //     };

  //     if (params.storeId) {
  //       orderWhere.storeId = params.storeId;
  //       settlementWhereSuccess.storeId = params.storeId;
  //       settlementWherePending.storeId = params.storeId;
  //     }

  //     const [
  //       totalOrderPrice = 0,
  //       totalSettledPrice = 0,
  //       settlementPending = 0,
  //     ] = await Promise.all([
  //       Order.sum("grandTotal", { where: orderWhere }),
  //       this.SettlementsRepository.sum("paid", {
  //         where: settlementWhereSuccess,
  //       }),
  //       this.SettlementsRepository.sum("paid", {
  //         where: settlementWherePending,
  //       }),
  //     ]);

  //     return new DataResponseDto(
  //       {
  //         amountToSettle: totalOrderPrice - totalSettledPrice,
  //         totalOrderPrice,
  //         totalSettledPrice,
  //         settlementPending,
  //       },
  //       true,
  //       "Success"
  //     );
  //   } catch (err) {
  //     if (err instanceof HttpException) throw err;
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }

  async findSummary(params: { storeId?: number }) {
    try {
      const orderWhere: any = { status: "delivered" };
      const settlementWhereSuccess: any = { status: "success" };
      const settlementWherePending: any = {
        status: { [Op.notIn]: ["success"] },
      };

      // 🔐 Apply store filter ONLY when explicitly provided
      if (params.storeId !== undefined) {
        orderWhere.storeId = params.storeId;
        settlementWhereSuccess.storeId = params.storeId;
        settlementWherePending.storeId = params.storeId;
      }

      const [
        totalOrderPrice = 0,
        totalSettledPrice = 0,
        settlementPending = 0,
      ] = await Promise.all([
        Order.sum("grandTotal", { where: orderWhere }) ?? 0,
        this.SettlementsRepository.sum("paid", {
          where: settlementWhereSuccess,
        }) ?? 0,
        this.SettlementsRepository.sum("paid", {
          where: settlementWherePending,
        }) ?? 0,
      ]);

      return new DataResponseDto(
        {
          amountToSettle: totalOrderPrice - totalSettledPrice,
          totalOrderPrice,
          totalSettledPrice,
          settlementPending,
        },
        true,
        "Success"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOne(id: number) {
    try {
      const settlements = await this.SettlementsRepository.findByPk(id);
      if (!settlements) throw new Error("No Data Found.@@");
      return new DataResponseDto(settlements, true, "Successfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(data: CreateSettlementsDto) {
    try {
      const result = await this.SettlementsRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const settlements = new Settlements();
          settlements.storeId = data.storeId;
          settlements.total = 0;
          settlements.balance = 0;
          settlements.paid = data.paid;
          settlements.status = data.status;

          settlements.payment_type = data.payment_type;
          const created = await settlements.save({ transaction });
          const [totalOrderPrice, totalSettledPrice] = await Promise.all([
            (await Order.sum("grandTotal", {
              where: { storeId: data?.storeId, status: "delivered" },
              transaction,
            })) ?? 0,
            (await this.SettlementsRepository.sum("paid", {
              where: { storeId: data?.storeId, status: "success" },
              transaction,
            })) ?? 0,
          ]);
          created.total = totalSettledPrice;
          created.balance = totalOrderPrice - totalSettledPrice;
          if (created.balance < 0) {
            throw new BadRequestException(
              "Settlement amount can't be more than Total balance"
            );
          }
          await created.save({ transaction });
          if (data.paid > created.balance) {
            throw new BadRequestException(
              "Settlement amount can't be more than Total balance"
            );
          }
          return created;
        }
      );
      return new DataResponseDto(result, true, "Successfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async createByStore(id: number, data: CreateSettlementsDto) {
    try {
      const result = await this.SettlementsRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const settlements = new Settlements();
          settlements.storeId = id;
          settlements.total = 0;
          settlements.balance = 0;
          settlements.paid = data.paid;
          settlements.user_bank_id = data.user_bank_id;
          settlements.status = "requested";
          settlements.remark = data.remark;
          settlements.payment_type = data.payment_type;
          const created = await settlements.save({ transaction });
          const [totalOrderPrice, totalSettledPrice] = await Promise.all([
            (await Order.sum("grandTotal", {
              where: { storeId: id, status: "delivered" },
              transaction,
            })) ?? 0,
            (await this.SettlementsRepository.sum("paid", {
              where: { storeId: id, status: "success" },
              transaction,
            })) ?? 0,
          ]);
          created.total = totalSettledPrice;
          created.balance = totalOrderPrice - totalSettledPrice;
          if (created.balance < 0) {
            throw new BadRequestException(
              "Settlement amount can't be more than Total balance"
            );
          }
          await created.save({ transaction });
          if (data.paid > created.balance) {
            throw new BadRequestException(
              "Settlement amount can't be more than Total balance"
            );
          }
          return created;
        }
      );
      return new DataResponseDto(result, true, "Successfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async getSettlementDetails(storeId: number) {
    try {
      const result = await Order.findOne({
        attributes: [
          [
            Sequelize.fn("sum", Sequelize.literal('"grandTotal"')),
            "grandTotal",
          ],
          [
            Sequelize.fn("sum", Sequelize.literal('"deliveryCharge"')),
            "deliveryCharge",
          ],
          [Sequelize.fn("sum", Sequelize.literal('"total"')), "productTotal"],
          [
            Sequelize.fn("sum", Sequelize.literal('"totalItems"')),
            "totalUnits",
          ],
          [Sequelize.fn("count", "*"), "totalOrders"],
          [
            Sequelize.fn(
              "count",
              Sequelize.literal(
                "CASE WHEN status = 'pending' THEN 1 ELSE null END"
              )
            ),
            "pendingOrders",
          ],
          [
            Sequelize.fn(
              "count",
              Sequelize.literal(
                "CASE WHEN status = 'delivered' THEN 1 ELSE null END"
              )
            ),
            "deliveredOrders",
          ],
          [
            Sequelize.fn(
              "count",
              Sequelize.literal(
                "CASE WHEN status = 'shipped' THEN 1 ELSE null END"
              )
            ),
            "shippedOrders",
          ],
          [
            Sequelize.fn(
              "count",
              Sequelize.literal(
                "CASE WHEN status = 'packed' THEN 1 ELSE null END"
              )
            ),
            "packedOrders",
          ],
          [
            Sequelize.fn(
              "count",
              Sequelize.literal(
                "CASE WHEN status = 'out_for_delivery' THEN 1 ELSE null END"
              )
            ),
            "outforDeliveryOrders",
          ],
          [
            Sequelize.fn(
              "count",
              Sequelize.literal(
                "CASE WHEN status = 'rejected' THEN 1 ELSE null END"
              )
            ),
            "rejectedOrders",
          ],
          [
            Sequelize.fn(
              "count",
              Sequelize.literal(
                "CASE WHEN status = 'cancelled' THEN 1 ELSE null END"
              )
            ),
            "cancelledOrders",
          ],

          [
            Sequelize.fn(
              "count",
              Sequelize.literal(
                "CASE WHEN status NOT IN ('pending','delivered') THEN 1 ELSE null END"
              )
            ),
            "otherOrders",
          ],
        ],
        where: {
          storeId,
        },
        raw: true,
      });
      return new DataResponseDto(result, true, "Successful");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async getOrderDetailsForStore(storeId: number) {
    try {
      const result = await this.SettlementsRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const [
            totalOrderAmount,
            totalOrderCount,
            productsCount,
            settledAmount,
          ] = await Promise.all([
            Order.sum("grandTotal", {
              where: { storeId, status: "delivered" },
              transaction,
            }) ?? 0,
            Order.count({
              where: { storeId, status: "delivered" },
              transaction,
            }),
            this.ProductsRepository.count({
              where: { store_id: storeId, status: true },
              transaction,
            }),
            this.SettlementsRepository.sum("paid", {
              where: { storeId, status: "success" },
              transaction,
            }) ?? 0,
          ]);

          return {
            totalOrderAmount,
            totalOrderCount,
            productsCount,
            settledAmount,
          };
        }
      );

      return new DataResponseDto(result, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updatePaymentStatus(id: number) {
    try {
      const result = await this.SettlementsRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const settle = await this.SettlementsRepository.findByPk(id, {
            transaction,
          });
          if (!settle) throw new Error("No Settlement found@@");
          settle.status = "success";
          await settle.save({ transaction });
          const [totalOrderPrice, totalSettledPrice] = await Promise.all([
            (await Order.sum("grandTotal", {
              where: { storeId: settle.storeId, status: "delivered" },
              transaction,
            })) ?? 0,
            (await this.SettlementsRepository.sum("paid", {
              where: { storeId: settle.storeId, status: "success" },
              transaction,
            })) ?? 0,
          ]);
          settle.total = totalSettledPrice;
          settle.balance = totalOrderPrice - totalSettledPrice;
          await settle.save({ transaction });
          if (settle.balance < 0) {
            throw new Error(
              "Settlement Can't be completed.. Amount is more than Balance@@"
            );
          }
          return settle;
        }
      );
      return new DataResponseDto(result, true, "");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updateRequestedStatus(
    id: number,
    type: string
  ): Promise<DataResponseDto> {
    try {
      const [affectedCount, affectedRows] =
        await this.SettlementsRepository.update(
          { status: type },
          {
            where: { id, status: { [Op.notIn]: ["success", "cancelled"] } },
            returning: true,
          }
        );

      if (affectedCount === 0) {
        return new DataResponseDto(
          [],
          true,
          `No settlement found with id ${id}`
        );
      }

      return new DataResponseDto(affectedRows, true, "Updated Successfully");
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }
}
