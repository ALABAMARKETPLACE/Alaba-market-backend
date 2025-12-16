import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { UserBankAccount } from "./user_bank_accounts.entity";
import { CreateUserBankAccountDto } from "./dto/create_user_bank_accounts.dto";
import { User } from "../USERS/user.entity";
import { where } from "sequelize";
import { UpdateUserBankAccountDto } from "./dto/update_user_bank_accounts.dto";

@Injectable()
export class UserBankAccountService {
  constructor(
    @Inject("UserBankAccountRepository")
    private readonly UserBankAccountRepository: typeof UserBankAccount
  ) {}

  async create(
    userId: number,
    createUserBankAccountDto: CreateUserBankAccountDto
  ): Promise<DataResponseDto> {
    try {
      const existingAccountsCount = await UserBankAccount.count({
        where: { userId, isDelete: false },
      });

      if (existingAccountsCount >= 5) {
        return new DataResponseDto(
          [],
          false,
          "You cannot have more than 5 bank accounts"
        );
      }
      const bankAccount = UserBankAccount.build({
        userId,
        ...createUserBankAccountDto,
      });
      const createdData = await bankAccount.save();
      return new DataResponseDto(createdData, true, "Successfully added");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findAll(userId: number): Promise<DataResponseDto> {
    try {
      const accounts = await this.UserBankAccountRepository.findAll({
        where: { userId, isDelete: false },
        include: [
          {
            model: User,
          },
        ],
      });
      return new DataResponseDto(accounts, true, "Successfully retrieved");
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findAllById(userId: number, id: number): Promise<DataResponseDto> {
    try {
      const account = await this.UserBankAccountRepository.findOne({
        where: { id, userId },
      });
      if (!account) {
        return new DataResponseDto({}, true, "No Bank Found");
      }
      return new DataResponseDto(
        account,
        true,
        "Successfully retrieved bank account"
      );
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(
    userId: number,
    id: number,
    updateUserBankAccountDto: UpdateUserBankAccountDto
  ): Promise<DataResponseDto> {
    try {
      const [affectedCount] = await this.UserBankAccountRepository.update(
        { ...updateUserBankAccountDto },
        { where: { id, userId } }
      );

      if (affectedCount === 0) {
        return new DataResponseDto([], true, "Account not found");
      }

      const updatedAccount = await this.UserBankAccountRepository.findByPk(id);
      return new DataResponseDto(
        updatedAccount,
        true,
        "Account updated successfully"
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }

  async softDelete(userId: number, id: number): Promise<DataResponseDto> {
    try {
      const [affectedCount, affectedRows] =
        await this.UserBankAccountRepository.update(
          { isDelete: true },
          {
            where: { id, userId },
            returning: true,
          }
        );

      if (affectedCount === 0) {
        return new DataResponseDto(
          [],
          true,
          "Bank account not found or already deleted"
        );
      }

      return new DataResponseDto(
        affectedRows,
        true,
        "Bank account soft-deleted successfully"
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }

  // async findAll(userId: number) {
  //   try {
  //     const allList = await this.AddressRepository.findAll<Address>({
  //       where: {
  //         userId,
  //       },
  //       attributes: { exclude: ["createdAt", "updatedAt"] },
  //       order: [["updatedAt", "DESC"]],
  //       include: [
  //         {
  //           model: User,
  //           required: true,
  //           attributes: ["name"],
  //         },
  //       ],
  //     });
  //     return new DataResponseDto(allList, true, "success");
  //   } catch (err) {
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }

  // async update(userId: number, id: number, data: UpdateAddressDto) {
  //   try {
  //     const [updateAddress] = await this.AddressRepository.update(
  //       { ...data },
  //       { where: { id, userId } }
  //     );
  //     if (updateAddress == 0) throw new NotFoundException();
  //     return new DataResponseDto(updateAddress, true, "Successfully updated");
  //   } catch (err) {
  //     if (err instanceof HttpException) throw err;
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }

  // async delete(userId: number, id: number) {
  //   try {
  //     const deleted = await this.AddressRepository.destroy({
  //       where: { id, userId },
  //     });
  //     if (!deleted) throw new Error("No Address found@@");
  //     return new DataResponseDto(deleted, true, "Address Removed");
  //   } catch (err) {
  //     if (err instanceof HttpException) throw err;
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }
  // async setDefault(userId: number, id: number) {
  //   try {
  //     const result = await this.AddressRepository.sequelize.transaction(
  //       async (transaction: Transaction) => {
  //         const setFalse = await this.AddressRepository.update(
  //           { default: false },
  //           { where: { userId }, transaction }
  //         );
  //         const setTrue = await this.AddressRepository.update(
  //           { default: true },
  //           { where: { id, userId }, transaction }
  //         );
  //         return setTrue;
  //       }
  //     );
  //     return new DataResponseDto(result, true, "Successfully updated.");
  //   } catch (err) {
  //     if (err instanceof HttpException) throw err;
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }
}
