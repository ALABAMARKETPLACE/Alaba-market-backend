import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Address } from "./address.entity";
import { CreateAddressDto } from "./dto/create.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Transaction } from "sequelize";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { UpdateAddressDto } from "./dto/updateAddress.dto";
@Injectable()
export class AddressService {
  constructor(
    @Inject("AddressRepository")
    private readonly AddressRepository: typeof Address
  ) {}

  async findAll(userId: number) {
    try {
      const allList = await this.AddressRepository.findAll<Address>({
        where: {
          userId,
        },
        attributes: { exclude: ["createdAt", "updatedAt"] },
        order: [["updatedAt", "DESC"]],
      });
      return new DataResponseDto(allList, true, "success");
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOne(userId: number, id: number) {
    try {
      const address = await this.AddressRepository.findOne<Address>({
        where: {
          id,
          userId,
        },
        attributes: { exclude: ["createdAt", "updatedAt"] },
      });

      if (!address) {
        throw new NotFoundException("Address not found");
      }

      return new DataResponseDto(address, true, "success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(userId: number, create: CreateAddressDto) {
    try {
      const createData = await this.AddressRepository.create({
        userId,
        ...create,
      });
      return new DataResponseDto(createData, true, "Successfully added");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(userId: number, id: number, data: UpdateAddressDto) {
    try {
      const [updateAddress] = await this.AddressRepository.update(
        { ...data },
        { where: { id, userId } }
      );
      if (updateAddress == 0) throw new NotFoundException();
      return new DataResponseDto(updateAddress, true, "Successfully updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(userId: number, id: number) {
    try {
      const deleted = await this.AddressRepository.destroy({
        where: { id, userId },
      });
      if (!deleted) throw new Error("No Address found@@");
      return new DataResponseDto(deleted, true, "Address Removed");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async setDefault(userId: number, id: number) {
    try {
      const sequelize = this.AddressRepository.sequelize;
      if (!sequelize) {
        throw new InternalServerErrorException("Database instance is unavailable");
      }
      const result = await sequelize.transaction(
        async (transaction: Transaction) => {
          const setFalse = await this.AddressRepository.update(
            { default: false },
            { where: { userId }, transaction }
          );
          const setTrue = await this.AddressRepository.update(
            { default: true },
            { where: { id, userId }, transaction }
          );
          return setTrue;
        }
      );
      return new DataResponseDto(result, true, "Successfully updated.");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
