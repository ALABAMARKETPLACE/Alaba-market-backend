import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { NewAddress } from "./newaddress.entity";
import { CreateNewAddressDto } from "./dto/create.dto";
import { UpdateNewAddressDto } from "./dto/update.dto";
import { GetAllNewAddressDto } from "./dto/getAll.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Countries } from "../COUNTRIES/countries.entity";
import { States } from "../STATES/states.entity";
import { User } from "../USERS/user.entity";
import { Op } from "sequelize";

@Injectable()
export class NewAddressService {
  constructor(
    @Inject("NewAddressRepository")
    private readonly NewAddressRepository: typeof NewAddress
  ) {}

  async findAll(userId: number, pageOptionsDto: GetAllNewAddressDto) {
    try {
      const {
        page = 1,
        take = 10,
        query = "",
        order = "DESC",
      } = pageOptionsDto;
      const offset = (page - 1) * take;

      const whereClause: any = { user_id: userId };

      // Search by address, pincode, country name or state name
      if (query) {
        whereClause[Op.or] = [
          { full_address: { [Op.iLike]: `%${query}%` } },
          { pincode: { [Op.iLike]: `%${query}%` } },
          { "$countryDetails.country_name$": { [Op.iLike]: `%${query}%` } },
          { "$stateDetails.name$": { [Op.iLike]: `%${query}%` } },
        ];
      }

      const { rows: data, count } =
        await this.NewAddressRepository.findAndCountAll({
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

  async findCurrent(userId: number) {
    try {
      const data = await this.NewAddressRepository.findAll<NewAddress>({
        where: { user_id: userId },
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
        order: [["createdAt", "DESC"]],
      });

      return new DataResponseDto(data, true, "Success");
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOne(userId: number, id: number) {
    try {
      const address = await this.NewAddressRepository.findOne<NewAddress>({
        where: { id, user_id: userId },
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
      if (!address) {
        throw new NotFoundException("Address not found");
      }
      return new DataResponseDto(address, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(userId: number, create: CreateNewAddressDto) {
    try {
      // Validate at least one of country_id or state_id is provided
      if (!create.country_id && !create.state_id) {
        throw new BadRequestException(
          "Either country or state must be provided"
        );
      }

      const address = NewAddress.build({ user_id: userId, ...create });
      const createData = await address.save();
      return new DataResponseDto(createData, true, "Successfully created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(userId: number, id: number, data: UpdateNewAddressDto) {
    try {
      const address = await this.NewAddressRepository.findOne({
        where: { id, user_id: userId },
      });

      if (!address) {
        throw new NotFoundException("Address not found");
      }

      // Validate at least one of country_id or state_id is provided
      const newCountryId =
        data.country_id !== undefined ? data.country_id : address.country_id;
      const newStateId =
        data.state_id !== undefined ? data.state_id : address.state_id;

      if (!newCountryId && !newStateId) {
        throw new BadRequestException(
          "Either country or state must be provided"
        );
      }

      const [updated] = await this.NewAddressRepository.update(
        { ...data },
        { where: { id, user_id: userId } }
      );

      if (updated === 0) {
        throw new NotFoundException("Address not found");
      }

      const updatedAddress = await this.NewAddressRepository.findByPk(id, {
        include: [
          { model: Countries, as: "countryDetails" },
          { model: States, as: "stateDetails" },
        ],
      });
      return new DataResponseDto(updatedAddress, true, "Successfully updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(userId: number, id: number) {
    try {
      const deleted = await this.NewAddressRepository.destroy({
        where: { id, user_id: userId },
      });

      if (!deleted) {
        throw new NotFoundException("Address not found");
      }

      return new DataResponseDto(deleted, true, "Successfully deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
