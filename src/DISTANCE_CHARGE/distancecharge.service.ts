import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from "@nestjs/common";
import { DistanceCharge } from "./distancecharge.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateDistanceChargeDto } from "./dto/createDistanceCharge.dto";
import { UpdateDistanceChargeDto } from "./dto/updateDistanceCharge.dto";
import { DistanceChargeDto } from "./dto/distancecharge.dto";
import { Op, Transaction } from "sequelize";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { GetTotalChargeDto } from "./dto/get_total.dto";
import { UpsertDistanceChargeDto } from "./dto/upsertDistanceharge.dto";

@Injectable()
export class DistanceChargeService {
  constructor(
    @Inject("DistanceChargeRepository")
    private readonly distanceChargeRepository: typeof DistanceCharge
  ) {}

  async findAll() {
    try {
      const deliveryCharges = await this.distanceChargeRepository.findAll({});
      const data = deliveryCharges.map(
        (item: DistanceCharge) => new DistanceChargeDto(item)
      );
      return new DataResponseDto(data, true, "Successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(data: CreateDistanceChargeDto[]) {
    try {
      for (const item of data) {
        const distanceCharge = new DistanceCharge();
        if (!distanceCharge)
          throw new HttpException("No Data Found@@", HttpStatus.NOT_FOUND);
        if (item.operator !== undefined) {
          distanceCharge.operator = item.operator;
        }
        if (item.distance !== undefined) {
          distanceCharge.distance = item.distance;
        }
        if (item.charge !== undefined) {
          distanceCharge.charge = item.charge;
        }
        await distanceCharge.save();
      }
      return new DataResponseDto({}, true, "Successfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(data: UpdateDistanceChargeDto[]) {
    try {
      for (const item of data) {
        const distanceCharge = await DistanceCharge.findByPk(item.id);
        if (!distanceCharge)
          throw new HttpException("No Data found@@", HttpStatus.NOT_FOUND);
        if (item.operator !== undefined) {
          distanceCharge.operator = item.operator;
        }
        if (item.distance !== undefined) {
          distanceCharge.distance = item.distance;
        }
        if (item.charge !== undefined) {
          distanceCharge.charge = item.charge;
        }
        await distanceCharge.save();
      }
      return new DataResponseDto({}, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async upsertCharge(data: UpsertDistanceChargeDto) {
    try {
      const result = await this.distanceChargeRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          let upsertId: number[] = [];
          let newDistanceCharge: DistanceCharge[] = [];
          for (const item of data.distanceChargeItems) {
            if (item?.id) {
              const charge = await this.distanceChargeRepository.findByPk(
                item?.id
              );
              if (!charge) {
                throw new Error("Invalid Id@@");
              }
            }
            if (
              !item?.id &&
              (item?.distance === undefined ||
                item?.charge === undefined ||
                item?.charge < 0 ||
                !item?.operator)
            ) {
              throw new Error(`All Field are Required for Product Charge@@`);
            }
            const [upsertData, created] =
              await this.distanceChargeRepository.upsert(item, {
                transaction,
              });
            upsertId.push(upsertData.id);
            newDistanceCharge.push(upsertData);
          }
          const deletedCharges = await this.distanceChargeRepository.destroy({
            where: {
              id: {
                [Op.notIn]: [...upsertId],
              },
            },
            transaction,
          });
          return newDistanceCharge;
        }
      );
      return new DataResponseDto(result, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async delete(id: number) {
    try {
      const distanceCharge = await DistanceCharge.findByPk(id);
      if (!distanceCharge) throw new Error("No Data found@@");
      await distanceCharge.destroy();
      return new DataResponseDto(distanceCharge, true, "Successfully Deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async getDistanceCharge(data: GetTotalChargeDto, transaction: Transaction) {
    try {
      const inputDistance = data.distance;

      // const amount = await this.distanceChargeRepository.findOne({
      //   attributes: ["charge"],
      //   order: [
      //     [
      //       DistanceCharge.sequelize.fn(
      //         "ABS",
      //         DistanceCharge.sequelize.literal("distance - :inputDistance")
      //       ),
      //       "ASC",
      //     ],
      //   ],
      //   where: {
      //     distance: {
      //       [Op.gte]: inputDistance, // Distances less than or equal to input
      //     },
      //   },
      //   limit: 1,
      //   replacements: { inputDistance },
      //   transaction,
      // });

      const amount = await this.distanceChargeRepository.findOne({
        attributes: ["charge"],
        order: [["distance", "DESC"]],
        where: {
          distance: {
            [Op.lte]: inputDistance,
          },
        },
        limit: 1,
        transaction,
      });
      if (!amount)
        throw new Error("Unable to Calculate Delivery charge. ERRDISC1@@");
      return Number(amount?.charge);
    } catch (err) {
      throw new Error(getErrorMessage(err) + "@@");
    }
  }
}
