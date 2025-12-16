import {
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { compare } from "bcrypt";
import { Op, Sequelize, Transaction } from "sequelize";

import { User } from "./user.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { MailService } from "../MAILS/Mails.services";
import { getErrorMessage } from "../shared/helpers/errormessage";
import {
  UserAddPasswordUpdateDto,
  UserPasswordUpdateDto,
} from "./dto/updatePassword.dto";
import { ResetMailHtml } from "../MAILS/templates/auth/changeMailHtml";
import { ResetPhone } from "../MAILS/templates/auth/changePhoneHtml";
import { ReactivateMail } from "../MAILS/templates/auth/reactivate";
import { CheckUserExistDto } from "./dto/checkUserExist.dto";
import { PageOptionsForUsersAll } from "./dto/getUsersforAdmin.dto";
import { VerityDeactivateIdToken } from "./dto/verifyIdToken.dto";
import { UserUpdateProfilePicture } from "./dto/user_update.dto";
import { UserPhoneUpdateDto } from "./dto/user_phone.update.dto";
import { UserEmailUpdateDto } from "./dto/user_email.update.dto";
const DeactivateMail = require("../MAILS/templates/auth/deactivate");
import { generateFromEmail } from "unique-username-generator";
import { UserNameUpdateDto } from "./dto/user_name.update.dto";
import { FirebaseService } from "../FIREBASE/firebase.service";
import { Role } from "../shared/enum/role.enum";

@Injectable()
export class UserService {
  constructor(
    @Inject("UserRepository")
    private readonly UserRepository: typeof User,
    private readonly mailService: MailService,
    @Inject("hashPassword")
    private hashPassword: (password: string) => Promise<string>,
    private readonly firebaseService: FirebaseService
  ) {}

  async findAll(pageOptions: PageOptionsForUsersAll) {
    const { name, status, offset } = pageOptions;
    try {
      const { count, rows } = await this.UserRepository.findAndCountAll<User>({
        attributes: {
          exclude: [
            "updatedAt",
            "password",
            "type",
            "role",
            "role_id",
            "store_id",
          ],
        },
        limit: pageOptions.take,
        offset,
        order: [["createdAt", "DESC"]],
        where: {
          ...((status == true || status == false) && { status }),
          ...(name && {
            [Op.or]: [
              { name: { [Op.iLike]: `%${name}%` } },
              { email: name },
              { phone: name },
            ],
          }),
        },
      });
      return new DataResponseDto(rows, true, "Successfull", pageOptions, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOne(userId: number) {
    try {
      const user = await this.UserRepository.findByPk(userId, {
        attributes: { exclude: ["updatedAt"] },
      });
      if (!user) throw new NotFoundException();
      return new DataResponseDto(user, true, "Successfull");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updateEmail(_id: number, { email }: UserEmailUpdateDto) {
    try {
      const [count, [updated]] = await this.UserRepository.update(
        {
          email,
          mail_verify: false,
        },
        { where: { _id }, returning: true }
      );
      if (count == 0) throw new NotFoundException();
      let Mail = await ResetMailHtml(updated);
      this.mailService.updateEmailNotify(Mail);
      return new DataResponseDto(updated, true, "Email updated successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updatePhoto(_id: number, { image }: UserUpdateProfilePicture) {
    try {
      const [status, [user]] = await this.UserRepository.update(
        { image },
        { where: { _id }, returning: true }
      );
      if (status == 0) throw new NotFoundException();
      return new DataResponseDto(user, true, "Photo updated successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updatePhone(_id: number, updateUser: UserPhoneUpdateDto) {
    try {
      const guser = await this.firebaseService.verifyIdToken(
        updateUser.idToken
      );
      const phoneNumber = guser?.phone_number?.replace(
        updateUser.countryCode,
        ""
      );
      if (!guser?.phone_number) throw new UnauthorizedException();
      const [status, [user]] = await this.UserRepository.update(
        {
          phone: phoneNumber,
          countrycode: updateUser?.countryCode,
          phone_verify: true,
        },
        { where: { _id }, returning: true }
      );
      if (status == 0) throw new NotFoundException();
      let Mail = await ResetPhone(user);
      this.mailService.updateEmailNotify(Mail);
      const message = "Phone Number updated successfully";
      return new DataResponseDto(user, true, message);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updatePassword(id: number, updatePassword: UserPasswordUpdateDto) {
    try {
      const user = await this.UserRepository.findByPk(id);
      if (!user) throw new NotFoundException();
      const isMatch = await compare(updatePassword?.oldPassword, user.password);
      if (!isMatch) throw new UnauthorizedException("Invalid Password..");
      let password = await this.hashPassword(updatePassword?.newPassword);
      user.password = password;
      await user.save();
      return new DataResponseDto(user, true, "Password Updated Successfully.");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updateName(_id: number, data: UserNameUpdateDto) {
    try {
      const [updated, [newone]] = await this.UserRepository.update(
        { ...data },
        { where: { _id }, returning: true }
      );
      if (updated == 0) throw new NotFoundException();
      newone.name = `${newone.first_name ?? ""} ${newone.last_name ?? ""}`;
      const recent = await newone.save();
      return new DataResponseDto(recent, true, "Updated Successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async deactivateUser(_id: number, { idToken }: VerityDeactivateIdToken) {
    try {
      const guser = await this.firebaseService.verifyIdToken(idToken);
      if (!guser?.phone_number)
        throw new UnauthorizedException("Failed to Deactivate");
      const [count, [user]] = await User.update(
        { status: false },
        { where: { _id }, returning: true }
      );
      if (count == 0) throw new NotFoundException();
      let Mail = await DeactivateMail(user, {});
      this.mailService.AuthMail(Mail);
      return new DataResponseDto({}, true, "Account Deactivated successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async reactivateUser(_id: number) {
    try {
      const [status, [user]] = await this.UserRepository.update(
        { status: true },
        { where: { _id }, returning: true }
      );
      if (status == 0) throw new NotFoundException();
      let Mail = await ReactivateMail(user, {});
      this.mailService.AuthMail(Mail);
      return new DataResponseDto({}, true, "User Reactivated successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async addPassword(id: number, updatePassword: UserAddPasswordUpdateDto) {
    try {
      const user = await this.UserRepository.findByPk(id);
      if (!user) throw new NotFoundException();
      if (user.password)
        throw new ConflictException(
          "Password Already exist!! Please use change password option or try forgot password"
        );
      let password = await this.hashPassword(updatePassword?.newPassword);
      user.password = password;
      await user.save();
      return new DataResponseDto(user, true, "Password Added successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async refreshUserData(id: number) {
    try {
      const user = await this.UserRepository.findByPk(id, {
        attributes: {
          exclude: ["createdAt", "updatedAt", "role_id"],
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM "WISHLIST" WHERE "userId" = ?)`
              ),
              "wishlist",
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM "NOTIFICATIONS" WHERE "userId" = ?)`
              ),
              "notifications",
            ],
          ],
        },
        replacements: [id, id],
      });
      const message = "Successfully fetched user details";
      if (!user) throw new NotFoundException();
      return new DataResponseDto(user, true, message);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async checkUserExist({ email, phone }: CheckUserExistDto) {
    try {
      const user = await this.UserRepository.findOne({
        where: { [Op.or]: [{ email }, { phone }] },
      });
      const message =
        "An account is already registred with this email or phone. please chose another one";
      if (user) {
        return new DataResponseDto({}, false, message);
      }
      return new DataResponseDto({}, true, "No user found");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  //to register a user when he is registering as a seller (become a seller)
  async createSeller(store_id: number, data: any, transaction: Transaction) {
    try {
      let password = await this.hashPassword(data?.password);
      const user = new User();
      user.username = generateFromEmail(data?.email, 4);
      user.password = password;
      user.first_name = data?.first_name;
      user.last_name = data?.last_name;
      user.name = `${data?.first_name} ${data?.last_name}`;
      user.email = data?.email?.toLowerCase();
      user.countrycode = data?.code;
      user.phone = data?.phone;
      user.type = Role.Seller;
      user.mail_verify = false;
      user.phone_verify = false; // CHANGED: No phone verification without Firebase OTP
      user.status = true;
      user.store_id = store_id;
      user.image =
        "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/profileicon.png";
      const newUser = await user.save({ transaction });
      return newUser;
    } catch (err) {
      throw new Error(getErrorMessage(err) + "@@");
    }
  }

  async updateUserToSeller(
    store_id: number,
    userId: number,
    transaction: Transaction,
    password: string
  ) {
    try {
      const User = await this.UserRepository.findByPk(userId);
      if (!User) {
        throw new Error("No user has been found@@");
      }
      User.store_id = store_id;
      User.type = Role.Seller;
      if (!User.password) {
        let passwordNew = await this.hashPassword(password);
        User.password = passwordNew;
      }
      const newUser = await User.save({ transaction });
      return newUser;
    } catch (error) {
      throw new Error(getErrorMessage(error) + "@@");
    }
  }
}
