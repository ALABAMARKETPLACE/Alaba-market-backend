import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { NewDistanceCharge } from "./newdistancecharge.entity";
import { CreateNewDistanceChargeDto } from "./dto/create.dto";
import { UpdateNewDistanceChargeDto } from "./dto/update.dto";
import { GetAllNewDistanceChargeDto } from "./dto/getAll.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Countries } from "../COUNTRIES/countries.entity";
import { States } from "../STATES/states.entity";
import { Op } from "sequelize";

@Injectable()
export class NewDistanceChargeService {
  constructor(
    @Inject("NewDistanceChargeRepository")
    private readonly NewDistanceChargeRepository: typeof NewDistanceCharge
  ) {}

  async findAll(pageOptionsDto: GetAllNewDistanceChargeDto) {
    try {
      const {
        page = 1,
        take = 10,
        query = "",
        order = "DESC",
      } = pageOptionsDto;
      const offset = (page - 1) * take;

      const whereClause: any = {};

      // Search by country name or state name
      if (query) {
        whereClause[Op.or] = [
          { "$countryDetails.country_name$": { [Op.iLike]: `%${query}%` } },
          { "$stateDetails.name$": { [Op.iLike]: `%${query}%` } },
        ];
      }

      const { rows: data, count } =
        await this.NewDistanceChargeRepository.findAndCountAll({
          where: whereClause,
          attributes: { exclude: ["deletedAt"] },
          include: [
            {
              model: Countries,
              as: "countryDetails",
              attributes: ["id", "country_name", "description"],
            },
            {
              model: States,
              as: "stateDetails",
              attributes: ["id", "name", "description"],
            },
          ],
          order: [["createdAt", order]],
          limit: take,
          offset: offset,
        });

      return new DataResponseDto(data, true, "Success", pageOptionsDto, count);
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOne(id: number) {
    try {
      const charge =
        await this.NewDistanceChargeRepository.findByPk<NewDistanceCharge>(id, {
          attributes: { exclude: ["deletedAt"] },
          include: [
            {
              model: Countries,
              as: "countryDetails",
              attributes: ["id", "country_name", "description"],
            },
            {
              model: States,
              as: "stateDetails",
              attributes: ["id", "name", "description"],
            },
          ],
        });
      if (!charge) {
        throw new NotFoundException("Distance charge not found");
      }
      return new DataResponseDto(charge, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(create: CreateNewDistanceChargeDto) {
    try {
      // Validate max_weight > min_weight
      if (create.max_weight <= create.min_weight) {
        throw new BadRequestException(
          "Maximum weight must be greater than minimum weight"
        );
      }

      // Check for duplicate combination
      const whereClause: any = {
        min_weight: create.min_weight,
        max_weight: create.max_weight,
      };

      if (create.country_id) {
        whereClause.country_id = create.country_id;
      } else {
        whereClause.country_id = null;
      }

      if (create.state_id) {
        whereClause.state_id = create.state_id;
      } else {
        whereClause.state_id = null;
      }

      const existing = await this.NewDistanceChargeRepository.findOne({
        where: whereClause,
      });

      if (existing) {
        throw new BadRequestException(
          "This distance charge configuration already exists"
        );
      }

      const charge = NewDistanceCharge.build({ ...create });
      const createData = await charge.save();
      return new DataResponseDto(createData, true, "Successfully created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(id: number, data: UpdateNewDistanceChargeDto) {
    try {
      const charge = await this.NewDistanceChargeRepository.findByPk(id);

      if (!charge) {
        throw new NotFoundException("Distance charge not found");
      }

      // Validate max_weight > min_weight if both provided
      const newMinWeight = data.min_weight ?? charge.min_weight;
      const newMaxWeight = data.max_weight ?? charge.max_weight;

      if (newMaxWeight <= newMinWeight) {
        throw new BadRequestException(
          "Maximum weight must be greater than minimum weight"
        );
      }

      // Check for duplicate combination (excluding current record)
      const whereClause: any = {
        min_weight: newMinWeight,
        max_weight: newMaxWeight,
        id: { [Op.ne]: id },
      };

      const newCountryId =
        data.country_id !== undefined ? data.country_id : charge.country_id;
      const newStateId =
        data.state_id !== undefined ? data.state_id : charge.state_id;

      if (newCountryId) {
        whereClause.country_id = newCountryId;
      } else {
        whereClause.country_id = null;
      }

      if (newStateId) {
        whereClause.state_id = newStateId;
      } else {
        whereClause.state_id = null;
      }

      const existing = await this.NewDistanceChargeRepository.findOne({
        where: whereClause,
      });

      if (existing) {
        throw new BadRequestException(
          "This distance charge configuration already exists"
        );
      }

      const [updated] = await this.NewDistanceChargeRepository.update(
        { ...data },
        { where: { id } }
      );

      if (updated === 0) {
        throw new NotFoundException("Distance charge not found");
      }

      const updatedCharge = await this.NewDistanceChargeRepository.findByPk(
        id,
        {
          include: [
            { model: Countries, as: "countryDetails" },
            { model: States, as: "stateDetails" },
          ],
        }
      );
      return new DataResponseDto(updatedCharge, true, "Successfully updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(id: number) {
    try {
      const deleted = await this.NewDistanceChargeRepository.destroy({
        where: { id },
      });

      if (!deleted) {
        throw new NotFoundException("Distance charge not found");
      }

      return new DataResponseDto(deleted, true, "Successfully deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
