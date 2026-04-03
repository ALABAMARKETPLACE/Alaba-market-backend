import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from "@nestjs/common";
import { DeliveryCharge } from "./deliverycharge.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateDeliveryChargeDto } from "./dto/createDeliveryCharge.dto";
import { UpdateDeliveryChargeDto } from "./dto/updateDeliveryCharge.dto";
import { DeliveryChargeDto } from "./dto/deliverycharge.dto";
import { CaluclateDeliveryChargeDto } from "./dto/calculate_delivery.dto";
import { Op, Transaction } from "sequelize";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { UpsertDeliveryChargeDto } from "./dto/upsertDeliveryCharge.dto";

@Injectable()
export class DeliveryChargeService {
  constructor(
    @Inject("DeliveryChargeRepository")
    private readonly deliveryChargeRepository: typeof DeliveryCharge,
  ) {}

  async findAll() {
    try {
      const deliveryCharges = await this.deliveryChargeRepository.findAll({
        order: [["createdAt", "ASC"]],
      });
      const data = deliveryCharges.map(
        (item: DeliveryCharge) => new DeliveryChargeDto(item),
      );
      return new DataResponseDto(data, true, "Successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(data: CreateDeliveryChargeDto[]) {
    try {
      for (const item of data) {
        const deliveryCharge = new DeliveryCharge();
        if (!deliveryCharge)
          throw new HttpException("No ID found", HttpStatus.NOT_FOUND);

        // Update the fields based on the provided values in the DTO
        if (item.comparisonOperator !== undefined) {
          deliveryCharge.comparisonOperator = item.comparisonOperator;
        }
        if (item.amount !== undefined) {
          deliveryCharge.amount = item.amount;
        }
        if (item.charge !== undefined) {
          deliveryCharge.charge = item.charge;
        }
        await deliveryCharge.save();
      }
      return new DataResponseDto({}, true, "Successfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(data: UpdateDeliveryChargeDto[]) {
    try {
      for (const item of data) {
        const deliveryCharge = await DeliveryCharge.findByPk(item.id);
        if (!deliveryCharge)
          throw new HttpException("No Data found@@", HttpStatus.NOT_FOUND);

        // Update the fields based on the provided values in the DTO
        if (item.comparisonOperator !== undefined) {
          deliveryCharge.comparisonOperator = item.comparisonOperator;
        }
        if (item.amount !== undefined) {
          deliveryCharge.amount = item.amount;
        }
        if (item.charge !== undefined) {
          deliveryCharge.charge = item.charge;
        }

        await deliveryCharge.save();
      }

      return new DataResponseDto({}, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async upsertCharge(data: UpsertDeliveryChargeDto) {
    try {
      const result = await this.deliveryChargeRepository.sequelize!.transaction(
        async (transaction: Transaction) => {
          let upsertId: number[] = [];
          let newDeliveryCharge: DeliveryCharge[] = [];
          for (const item of data.deliveryChargeItems) {
            if (item?.id) {
              const charge = await this.deliveryChargeRepository.findByPk(
                item?.id,
              );
              if (!charge) {
                throw new Error("Invalid Id@@");
              }
            }
            if (
              !item?.id &&
              (item?.amount === undefined ||
                item?.charge === undefined ||
                item?.charge < 0 ||
                !item?.comparisonOperator)
            ) {
              throw new Error(`All Field are Required for Product Charge@@`);
            }
            const [upsertData, created] =
              await this.deliveryChargeRepository.upsert(item as any, {
                transaction,
              });
            upsertId.push(upsertData.id);
            newDeliveryCharge.push(upsertData);
          }
          const deletedCharges = await this.deliveryChargeRepository.destroy({
            where: {
              id: {
                [Op.notIn]: [...upsertId],
              },
            },
            transaction,
          });
          return newDeliveryCharge;
        },
      );
      return new DataResponseDto(result, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async delete(id: number) {
    try {
      const deliveryCharge = await DeliveryCharge.findByPk(id);
      if (!deliveryCharge)
        throw new HttpException("No ID found", HttpStatus.NOT_FOUND);
      await deliveryCharge.destroy();
      return new DataResponseDto(deliveryCharge, true, "Successfully Deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // async getDeliveryCharge(
  //   data: CaluclateDeliveryChargeDto,
  //   transaction: Transaction
  // ) {
  //   try {
  //     const { amount: inputAmount } = data;
  //     const charge = await this.deliveryChargeRepository.findOne({
  //       attributes: ["charge"],
  //       order: [
  //         [
  //           DeliveryCharge.sequelize.fn(
  //             "ABS",
  //             DeliveryCharge.sequelize.literal("amount - :inputAmount")
  //           ),
  //           "ASC",
  //         ],
  //       ],
  //       where: {
  //         amount: {
  //           [Op.gte]: inputAmount,
  //         },
  //       },
  //       limit: 1,
  //       replacements: { inputAmount },
  //       transaction,
  //     });
  //     if (!charge)
  //       throw new Error("Unable to calculate Delivery Charge ERRDELC1.@@");
  //     return charge.charge;
  //   } catch (err) {
  //     throw new Error(getErrorMessage(err) + "@@");
  //   }
  // }

  async getDeliveryCharge(
    data: CaluclateDeliveryChargeDto,
    transaction: Transaction,
  ) {
    try {
      const { amount: inputAmount } = data;
      const charge = await this.deliveryChargeRepository.findOne({
        attributes: ["charge"],
        order: [["amount", "DESC"]],
        where: {
          amount: {
            [Op.lte]: inputAmount,
          },
        },
        limit: 1,
        transaction,
      });
      if (!charge)
        throw new Error("Unable to calculate Delivery Charge ERRDELC1.@@");
      return charge.charge;
    } catch (err) {
      throw new Error(getErrorMessage(err) + "@@");
    }
  }
}
