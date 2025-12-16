import { HttpException, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { BusinessType } from "./businesstype.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateBusinessTypeDto } from "./dto/createBusinessType.dto";
import { UpdateBusinessTypeDto } from "./dto/updateBusinessType.dto";
import { BusinessTypeDto } from "./dto/businesstype.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
@Injectable()
export class BusinessTypeService {
  constructor(
    @Inject("BusinessTypeRepository")
    private readonly BusinessTypeRepository: typeof BusinessType
  ) {}

  async findAll() {
    try {
      const businesstype = await this.BusinessTypeRepository.findAll({});
      const data = businesstype.map(
        (item: BusinessType) => new BusinessTypeDto(item)
      );
      return new DataResponseDto(data, true, "Fetched Successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(data: CreateBusinessTypeDto) {
    try {
      const businesstype = new BusinessType();
      businesstype.name = data.name;
      businesstype.description = data.description;
      const created = await businesstype.save();
      return new DataResponseDto(created, true, "Successfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(id: number, data: UpdateBusinessTypeDto) {
    try {
      const businesstype = await BusinessType.findByPk(id);
      if (!businesstype) throw new Error("No Business type found@@");
      businesstype.name = data.name;
      businesstype.description = data.description;
      const updated = await businesstype.save();
      return new DataResponseDto(businesstype, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(id: number) {
    try {
      const businesstype = await BusinessType.findByPk(id);
      if (!businesstype) throw new Error("No Business type found");
      await businesstype.destroy();
      return new DataResponseDto(businesstype, true, "Successfully Deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
