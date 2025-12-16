import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { CreatePrintConfigerationDto } from "./dto/create_print_configeration.dto";
import { UpdatePrintConfigerationDto } from "./dto/update_print_configeration.dto";
import { PrintConfigeration } from "./print_configeration.entity";
import { PrintPriceDto } from "./dto/print_configeration.dto";
import { PageOptionsGetConfiguraitionDto } from "./dto/getPrintConfiguration.dto";
import { Op,Sequelize } from "sequelize";

@Injectable()
export class PrintConfigerationService {
  constructor(
    @Inject("PrintConfigerationRepository")
    private readonly printConfigerationRepository: typeof PrintConfigeration
  ) {}

  async findAll(pageOptions: PageOptionsGetConfiguraitionDto) {
    try {
      const { search, filter, order, limit, offset } = pageOptions;
      console.log("paramns", search, filter, order, limit, offset);
      
      const queryOptions: any = {
        attributes: {
          exclude: ["createdAt", "updatedAt"]
        }
      };
      if (pageOptions.page) {
        queryOptions.limit = limit;
        queryOptions.offset = offset;
      }
      
      console.log('queryOptions', queryOptions);
      queryOptions.order = [['id', order]]; 
      
      if (search && search.trim() !== '') {
        queryOptions.where = {
          ...queryOptions.where,
          [Op.or]: [
            { printType: { [Op.like]: `%${search}%` } },
            Sequelize.literal(`CAST("printColor" AS TEXT) ILIKE '%${search}%'`)
          ]
        };
      }
      console.log('queryOptions', queryOptions?.where);
      
      if (filter && filter.trim() !== '') {
        const [filterKey, filterValue] = filter.split(':');
        if (filterKey && filterValue) {
          queryOptions.where = {
            ...queryOptions.where,
            [filterKey]: filterValue
          };
        }
      }
      console.log('queryOptions', queryOptions);
      
      const data = await this.printConfigerationRepository.findAll(queryOptions);
      
      const count = await this.printConfigerationRepository.count({
        where: queryOptions.where
      });
      
      const response = {
        data,
        meta: {
          totalItems: count,
          itemsPerPage: limit || count,
          currentPage: pageOptions.page || 1,
          totalPages: limit ? Math.ceil(count / limit) : 1
        }
      };
      
      return new DataResponseDto(response, true, "All configurations fetched");
    } catch (err) {
      console.log('error', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findPrice(data:PrintPriceDto) {
    try {
      const print = await this.printConfigerationRepository.findOne({
        where:{
          printType:data?.printType,
          printColor:data?.printColor,
          doublesided:data?.doublesided
        }
      });
      if(!print){
        throw new NotFoundException("Print configuration not found@@")
      }
      return new DataResponseDto(print?.amount, true, "Price fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async createBulk(data: CreatePrintConfigerationDto[]) {
    try {
      const payload = data?.map((item) => ({
        printType: item.printType,
        printColor: item.printColor,
        doublesided: item.doublesided,
        amount: item.amount,
      }));

      const created = await this.printConfigerationRepository.bulkCreate(
        payload
      );
      return new DataResponseDto(
        created,
        true,
        "Print configurations created successfully"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async update(id: number, dto: UpdatePrintConfigerationDto) {
    try {
      const [affectedCount, updatedRows] =
        await this.printConfigerationRepository.update(dto, {
          where: { id },
          returning: true,
        });

      if (affectedCount === 0 || updatedRows.length === 0) {
        return new DataResponseDto(
          {},
          true,
          "Configuration not found or not updated"
        );
      }

      return new DataResponseDto(
        updatedRows[0],
        true,
        "Configuration updated successfully"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(id: number) {
    try {
      const config = await this.printConfigerationRepository.findByPk(id);
      if (!config)
        return new DataResponseDto(null, true, "Configuration not found");

      await config.destroy();
      return new DataResponseDto(null, true, "Configuration deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findUniqueConfigurations() {
    try {
      const allConfigurations = await this.printConfigerationRepository.findAll({
        attributes: ['printType', 'printColor'],
        raw: true
      });
      
      const uniquePrintTypes = [...new Set(allConfigurations.map(config => config.printType))];
      
      const uniquePrintColors = [...new Set(allConfigurations.map(config => config.printColor))];
      
      return new DataResponseDto(
        { printTypes: uniquePrintTypes, printColors: uniquePrintColors },
        true,
        "Unique configurations fetched successfully"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
