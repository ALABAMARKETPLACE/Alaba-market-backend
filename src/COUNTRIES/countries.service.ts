import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Countries } from "./countries.entity";
import { CreateCountriesDto } from "./dto/create.dto";
import { UpdateCountriesDto } from "./dto/updateCountries.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Op } from "sequelize";

@Injectable()
export class CountriesService {
  constructor(
    @Inject("CountriesRepository")
    private readonly CountriesRepository: typeof Countries
  ) {}

  async findAll() {
    try {
      const allList = await this.CountriesRepository.findAll<Countries>({
        attributes: { exclude: ["deletedAt"] },
        order: [["createdAt", "DESC"]],
      });
      return new DataResponseDto(allList, true, "Success");
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOne(id: number) {
    try {
      const country = await this.CountriesRepository.findByPk<Countries>(id, {
        attributes: { exclude: ["deletedAt"] },
      });
      if (!country) {
        throw new NotFoundException("Country not found");
      }
      return new DataResponseDto(country, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(create: CreateCountriesDto) {
    try {
      // Check for duplicate country_name
      const existingCountry = await this.CountriesRepository.findOne({
        where: {
          country_name: create.country_name,
        },
      });

      if (existingCountry) {
        throw new BadRequestException(
          `Country with name "${create.country_name}" already exists`
        );
      }

      const country = Countries.build({ ...create });
      const createData = await country.save();
      return new DataResponseDto(createData, true, "Successfully created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(id: number, data: UpdateCountriesDto) {
    try {
      const country = await this.CountriesRepository.findByPk(id);

      if (!country) {
        throw new NotFoundException("Country not found");
      }

      // Check for duplicate country_name if being updated
      if (data.country_name && data.country_name !== country.country_name) {
        const existingCountry = await this.CountriesRepository.findOne({
          where: {
            country_name: data.country_name,
            id: { [Op.ne]: id },
          },
        });

        if (existingCountry) {
          throw new BadRequestException(
            `Country with name "${data.country_name}" already exists`
          );
        }
      }

      const [updated] = await this.CountriesRepository.update(
        { ...data },
        { where: { id } }
      );

      if (updated === 0) {
        throw new NotFoundException("Country not found");
      }

      const updatedCountry = await this.CountriesRepository.findByPk(id);
      return new DataResponseDto(updatedCountry, true, "Successfully updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(id: number) {
    try {
      const deleted = await this.CountriesRepository.destroy({
        where: { id },
      });

      if (!deleted) {
        throw new NotFoundException("Country not found");
      }

      return new DataResponseDto(deleted, true, "Successfully deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
