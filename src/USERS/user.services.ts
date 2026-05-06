import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { compare } from "bcrypt";
import { JwtService } from "@nestjs/jwt";
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
import { Store } from "../STORE/store.entity";
import { Order } from "../ORDER/order.entity";
import {
  deriveUserType,
  normalizeRole,
  normalizeRoles,
  resolveActiveRole,
} from "../shared/helpers/user-role.helper";
import { SendAdminInviteDto } from "./dto/send-admin-invite.dto";
import { AcceptAdminInviteDto } from "./dto/accept-admin-invite.dto";
const AdminInviteMail = require("../MAILS/templates/auth/adminInvite");

@Injectable()
export class UserService {
  constructor(
    @Inject("UserRepository")
    private readonly UserRepository: typeof User,
    private readonly mailService: MailService,
    @Inject("CreateToken")
    private createToken: (user: User, fid: number) => Promise<string | null>,
    @Inject("CreateVerifyToken")
    private createVerifyToken: (
      userId: number,
      purpose?:
        | "email_verification"
        | "password_reset"
        | "account_deactivation"
        | "admin_invitation",
    ) => Promise<string | null>,
    @Inject("hashPassword")
    private hashPassword: (password: string) => Promise<string>,
    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtService,
  ) {}

  private syncRoleState(
    user: User,
    roles: string[],
    activeRole?: string,
  ): User {
    const normalizedRoles = normalizeRoles(roles, user.role);
    const resolvedActiveRole = resolveActiveRole(
      normalizedRoles,
      activeRole,
      user.role,
    );

    user.roles = normalizedRoles;
    user.active_role = resolvedActiveRole;
    user.role = resolvedActiveRole;
    user.type = deriveUserType(normalizedRoles, resolvedActiveRole);
    return user;
  }

  private ensureAccountAvailable(user: User | null): User {
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.is_deleted) {
      throw new ForbiddenException("This account has been deleted");
    }

    if ((user.is_active ?? user.status) !== true || user.status !== true) {
      throw new ForbiddenException("This account is disabled");
    }

    return user;
  }

  private ensureAdminInviteUserName(email: string) {
    return generateFromEmail(email, 4);
  }

  private verifyAdminInviteToken(token: string) {
    const verified: any = this.jwtService.verify(token);

    if (verified?.data?.purpose !== "admin_invitation") {
      throw new UnauthorizedException("Invalid invite token");
    }

    const userId = verified?.data?.userId;
    if (!userId) {
      throw new UnauthorizedException("Invalid invite token payload");
    }

    return userId;
  }

  async findAll(pageOptions: PageOptionsForUsersAll) {
    const { name, status, offset } = pageOptions;
    try {
      const { count, rows } = await this.UserRepository.findAndCountAll<User>({
        attributes: {
          exclude: ["updatedAt", "password", "role_id"],
        },
        limit: pageOptions.take,
        offset,
        order: [["createdAt", "DESC"]],
        where: {
          is_deleted: false,
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
      if (user?.is_deleted) throw new NotFoundException();
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
        {
          status: false,
          is_active: false,
          disabled_at: new Date(),
        },
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
        {
          status: true,
          is_active: true,
          is_deleted: false,
          disabled_at: null,
        },
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
      user.role = Role.User;
      user.roles = [Role.User, Role.Seller];
      user.active_role = Role.User;
      user.mail_verify = false;
      user.phone_verify = false; // CHANGED: No phone verification without Firebase OTP
      user.status = true;
      user.is_active = true;
      user.is_deleted = false;
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
      const User = await this.UserRepository.findByPk(userId, { transaction });
      if (!User) {
        throw new Error("No user has been found@@");
      }
      const roles = normalizeRoles(User.roles, User.role);
      if (!roles.includes(Role.Seller)) {
        roles.push(Role.Seller);
      }
      User.store_id = store_id;
      this.syncRoleState(User, roles, Role.User);
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

  async switchActiveRole(userId: number, role: string, fid: number) {
    try {
      const user = this.ensureAccountAvailable(
        await this.UserRepository.findByPk(userId),
      );
      const nextRole = normalizeRole(role);

      if (!nextRole) {
        throw new ConflictException(
          "Invalid role. Use buyer, seller, or admin.",
        );
      }

      const roles = normalizeRoles(user.roles, user.role);
      if (!roles.includes(nextRole)) {
        throw new ForbiddenException(
          "You do not have permission to switch to this role.",
        );
      }

      if (nextRole === Role.Seller) {
        if (!user.store_id) {
          throw new ConflictException("No seller store is linked to this user.");
        }

        const store = await Store.findByPk(user.store_id);
        if (!store || store.status !== "approved") {
          throw new ConflictException(
            "Seller role is unavailable until the linked store is approved.",
          );
        }
      }

      this.syncRoleState(user, roles, nextRole);
      const updatedUser = await user.save();
      const token = await this.createToken(updatedUser, fid);

      return new DataResponseDto(
        updatedUser,
        true,
        "Active role switched successfully",
        token,
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async disableUserAccount(userId: number) {
    try {
      const user = await this.UserRepository.findByPk(userId);
      if (!user || user.is_deleted) throw new NotFoundException("User not found");
      if (user.is_active === false && user.status === false) {
        return new DataResponseDto(user, true, "User account is already disabled");
      }

      user.is_active = false;
      user.status = false;
      user.disabled_at = new Date();
      const updatedUser = await user.save();
      return new DataResponseDto(
        updatedUser,
        true,
        "User account disabled successfully",
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async enableUserAccount(userId: number) {
    try {
      const user = await this.UserRepository.findByPk(userId);
      if (!user || user.is_deleted) throw new NotFoundException("User not found");

      user.is_active = true;
      user.status = true;
      user.disabled_at = null;
      const updatedUser = await user.save();
      return new DataResponseDto(
        updatedUser,
        true,
        "User account enabled successfully",
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async softDeleteUser(userId: number) {
    try {
      const user = await this.UserRepository.findByPk(userId);
      if (!user) throw new NotFoundException("User not found");
      if (user.is_deleted) {
        return new DataResponseDto(user, true, "User is already deleted");
      }

      user.is_deleted = true;
      user.is_active = false;
      user.status = false;
      user.deleted_at = new Date();
      user.disabled_at = user.disabled_at ?? new Date();
      const updatedUser = await user.save();

      return new DataResponseDto(
        updatedUser,
        true,
        "User deleted successfully",
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async deleteMyAccount(userId: number) {
    try {
      const activeOrderCount = await Order.count({
        where: {
          userId,
          status: {
            [Op.notIn]: ["delivered", "cancelled", "rejected", "failed"],
          },
        },
      });

      if (activeOrderCount > 0) {
        throw new ConflictException(
          "You cannot delete your account while you have active orders.",
        );
      }

      return this.softDeleteUser(userId);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async assignAdminRole(userId: number, makeActive = false) {
    try {
      const user = await this.UserRepository.findByPk(userId);
      if (!user || user.is_deleted) throw new NotFoundException("User not found");

      const roles = normalizeRoles(user.roles, user.role);
      if (!roles.includes(Role.Admin)) {
        roles.push(Role.Admin);
      }

      const nextActiveRole = makeActive
        ? Role.Admin
        : user.active_role || user.role || Role.User;
      this.syncRoleState(user, roles, nextActiveRole);
      const updatedUser = await user.save();

      return new DataResponseDto(
        updatedUser,
        true,
        "Admin role assigned successfully",
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async sendAdminInvite(
    inviterId: number,
    payload: SendAdminInviteDto,
  ): Promise<DataResponseDto> {
    try {
      const inviter = await this.UserRepository.findByPk(inviterId);
      if (!inviter || inviter.is_deleted) {
        throw new NotFoundException("Inviting admin not found");
      }

      const normalizedEmail = payload.email.trim().toLowerCase();
      let user = await this.UserRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (user?.is_deleted) {
        throw new ConflictException("Cannot invite a deleted user account");
      }

      if (!user) {
        user = await this.UserRepository.create({
          email: normalizedEmail,
          username: this.ensureAdminInviteUserName(normalizedEmail),
          first_name: payload.first_name || normalizedEmail.split("@")[0],
          last_name: payload.last_name || "",
          name:
            [payload.first_name || normalizedEmail.split("@")[0], payload.last_name || ""]
              .filter(Boolean)
              .join(" ") || normalizedEmail.split("@")[0],
          password: null,
          role: Role.User,
          roles: [Role.User],
          active_role: Role.User,
          type: Role.User,
          mail_verify: false,
          phone_verify: false,
          status: false,
          is_active: false,
          is_deleted: false,
          image:
            "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/profileicon.png",
        } as Partial<User>);
      } else {
        const currentRoles = normalizeRoles(user.roles, user.role);
        if (currentRoles.includes(Role.Admin)) {
          throw new ConflictException("User is already an admin");
        }

        if (payload.first_name && !user.first_name) {
          user.first_name = payload.first_name;
        }
        if (payload.last_name && !user.last_name) {
          user.last_name = payload.last_name;
        }
        user.name =
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          user.name ||
          normalizedEmail.split("@")[0];
      }

      user.admin_invited_at = new Date();
      user.admin_invited_by = inviterId;
      user.admin_invite_accepted_at = null;
      await user.save();

      const token = await this.createVerifyToken(user._id, "admin_invitation");
      if (!token) {
        throw new InternalServerErrorException("Failed to create invite token");
      }

      const mail = await AdminInviteMail(
        {
          email: user.email,
          first_name: user.first_name,
          invitedByName: inviter.name,
        },
        token,
      );
      await this.mailService.AuthMail(mail);

      return new DataResponseDto(
        {
          userId: user._id,
          email: user.email,
          invited_at: user.admin_invited_at,
        },
        true,
        "Admin invite sent successfully",
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async validateAdminInvite(token: string): Promise<DataResponseDto> {
    try {
      const userId = this.verifyAdminInviteToken(token);
      const user = await this.UserRepository.findByPk(userId, {
        attributes: [
          "_id",
          "email",
          "first_name",
          "last_name",
          "name",
          "is_deleted",
          "admin_invited_at",
          "admin_invite_accepted_at",
        ],
      });

      if (!user || user.is_deleted) {
        throw new NotFoundException("Invited user not found");
      }

      if (!user.admin_invited_at) {
        throw new UnauthorizedException("No pending admin invite found");
      }

      if (user.admin_invite_accepted_at) {
        throw new ConflictException("This admin invite has already been accepted");
      }

      return new DataResponseDto(
        {
          userId: user._id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          name: user.name,
          invited_at: user.admin_invited_at,
        },
        true,
        "Admin invite is valid",
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  async acceptAdminInvite(payload: AcceptAdminInviteDto): Promise<DataResponseDto> {
    try {
      const userId = this.verifyAdminInviteToken(payload.token);

      const user = await this.UserRepository.findByPk(userId);
      if (!user || user.is_deleted) {
        throw new NotFoundException("Invited user not found");
      }

      if (!user.admin_invited_at) {
        throw new UnauthorizedException("No pending admin invite found");
      }

      if (user.admin_invite_accepted_at) {
        throw new ConflictException("This admin invite has already been accepted");
      }

      if (!user.password && !payload.password) {
        throw new ConflictException(
          "Password is required to activate this invited admin account",
        );
      }

      if (payload.first_name) {
        user.first_name = payload.first_name;
      }

      if (payload.last_name !== undefined) {
        user.last_name = payload.last_name;
      }

      if (!user.first_name) {
        user.first_name = user.email?.split("@")[0] || "Admin";
      }

      user.last_name = user.last_name || "";
      user.name =
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.email?.split("@")[0] ||
        "Admin";
      user.username =
        user.username || this.ensureAdminInviteUserName(user.email || "admin");

      if (payload.password) {
        user.password = await this.hashPassword(payload.password);
      }

      const roles = normalizeRoles(user.roles, user.role);
      if (!roles.includes(Role.Admin)) {
        roles.push(Role.Admin);
      }

      this.syncRoleState(user, roles, Role.Admin);
      user.mail_verify = true;
      user.status = true;
      user.is_active = true;
      user.admin_invite_accepted_at = new Date();
      const updatedUser = await user.save();

      return new DataResponseDto(
        updatedUser,
        true,
        "Admin invite accepted successfully",
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  async resetUserPasswordByAdmin(
    userId: number,
    password: string,
  ): Promise<DataResponseDto> {
    try {
      const user = await this.UserRepository.findByPk(userId);
      if (!user || user.is_deleted) {
        throw new NotFoundException("User not found");
      }

      user.password = await this.hashPassword(password);
      user.status = true;
      user.is_active = true;
      user.disabled_at = null;
      const updatedUser = await user.save();

      return new DataResponseDto(
        updatedUser,
        true,
        "Password reset successfully",
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
