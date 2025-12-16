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
import { User } from "../USERS/user.entity";
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
        include: [
          {
            model: User,
            required: true,
            attributes: ["name"],
          },
        ],
      });
      return new DataResponseDto(allList, true, "success");
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(userId: number, create: CreateAddressDto) {
    try {
      const address = Address.build({ userId, ...create });
      const createData = await address.save();
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
      const result = await this.AddressRepository.sequelize.transaction(
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
