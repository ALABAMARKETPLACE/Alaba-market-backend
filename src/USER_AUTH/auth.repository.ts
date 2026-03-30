import { Inject, Injectable } from "@nestjs/common";
import { User } from "../USERS/user.entity";
import { Op, Sequelize } from "sequelize";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { generateFromEmail } from "unique-username-generator";
import { signup_Request } from "./dto/signup.dto";
import { Role } from "../shared/enum/role.enum";
import { Store } from "../STORE/store.entity";

@Injectable()
export class AuthRepository {
  constructor(
    @Inject("hashPassword")
    private hashPassword: (password: string) => Promise<string>
  ) {}
  async findUserbyEmail(email: string) {
    try {
      const user = await User.findOne({
        where: {
          email,
        },
        attributes: {
          exclude: ["createdAt", "updatedAt", "role_id"],
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM "WISHLIST" WHERE "WISHLIST"."userId"="User"."_id")`
              ),
              "wishlist",
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM "NOTIFICATIONS" WHERE "NOTIFICATIONS"."userId"="User"."_id")`
              ),
              "notifications",
            ],
            [
              Sequelize.literal(
                `(SELECT id FROM "DELIVERY_COMPANY" WHERE "DELIVERY_COMPANY"."user_id"="User"."_id" LIMIT 1)`
              ),
              "delivery_company_id",
            ],
            [
              Sequelize.literal(
                `(SELECT id FROM "DRIVER" WHERE "DRIVER"."user_id"="User"."_id" LIMIT 1)`
              ),
              "driver_id",
            ],
          ],
        },
      });
      return user;
    } catch (error) {
      return null;
    }
  }

  async saveFcm(fcmtoken: string, _id: number) {
    console.log("==fcmtoken===", fcmtoken);
    try {
      const save = await User.update(
        {
          fcmtoken,
        },
        { where: { _id } }
      );
    } catch (err) {}
  }

  async findUserbyPhone(phone: string, countrycode: string) {
    try {
      const user = await User.findOne({
        where: { [Op.and]: { countrycode, phone } },
        raw: true,
        attributes: {
          exclude: ["createdAt", "updatedAt", "role_id"],
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM "WISHLIST" WHERE "WISHLIST"."userId"="User"."_id")`
              ),
              "wishlist",
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM "NOTIFICATIONS" WHERE "NOTIFICATIONS"."userId"="User"."_id")`
              ),
              "notifications",
            ],
            [
              Sequelize.literal(
                `(SELECT id FROM "DELIVERY_COMPANY" WHERE "DELIVERY_COMPANY"."user_id"="User"."_id" LIMIT 1)`
              ),
              "delivery_company_id",
            ],
            [
              Sequelize.literal(
                `(SELECT id FROM "DRIVER" WHERE "DRIVER"."user_id"="User"."_id" LIMIT 1)`
              ),
              "driver_id",
            ],
          ],
        },
      });
      return user;
    } catch (error) {
      return null;
    }
  }

  async createUserwithGmail(data: DecodedIdToken) {
    try {
      const user = await User.create({
        first_name: data?.name,
        last_name: "",
        username: generateFromEmail(data?.email, 4),
        name: data?.name,
        email: data?.email,
        type: Role.User,
        role: Role.User,
        roles: [Role.User],
        active_role: Role.User,
        image: data?.picture,
        mail_verify: data?.email_verified,
        status: true,
        is_active: true,
        is_deleted: false,
      });
      return user;
    } catch (error) {
      return null;
    }
  }

  async createUserwithAppleId(data: any) {
    try {
      const user = await User.create({
        first_name: generateFromEmail(data?.email, 4),
        last_name: "",
        username: generateFromEmail(data?.email, 4),
        name: data?.name,
        email: data?.email,
        type: Role.User,
        role: Role.User,
        roles: [Role.User],
        active_role: Role.User,
        image: data?.picture,
        mail_verify: data?.email_verified,
        status: true,
        is_active: true,
        is_deleted: false,
      });
      return user;
    } catch (error) {
      return null;
    }
  }

  async createNewUser(data: signup_Request, phoneNumber: string) {
    try {
      let password = await this.hashPassword(data?.password);
      const user = await User.create({
        username: generateFromEmail(data?.email, 4),
        password: password,
        first_name: data?.first_name,
        last_name: data?.last_name,
        name: `${data?.first_name} ${data?.last_name}`,
        email: data?.email?.toLowerCase(),
        countrycode: data?.countrycode,
        phone: phoneNumber,
        type: Role.User,
        role: Role.User,
        roles: [Role.User],
        active_role: Role.User,
        mail_verify: false,
        phone_verify: false, // CHANGED: No phone verification without Firebase OTP
        image:
          "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/profileicon.png",
        status: true,
        is_active: true,
        is_deleted: false,
        fcmtoken: data?.fcmtoken,
      });
      return user;
    } catch (error) {
      console.log(error)
      return error;
    }
  }

  async checkUserExist(email: string, phone: string) {
    try {
      const user = await User.findOne({
        where: { [Op.or]: [{ email }, { phone }] },
        raw: true,
      });
      return user;
    } catch (error) {
      return null;
    }
  }

  async saveSellerFcm(fcmToken: string, storeId: number) {
    try {
      if (!storeId) return;
      const store = await Store.findByPk(storeId);
      if (!store) return;
      store.fcmtoken = fcmToken;
      await store.save();
    } catch (err) {
      console.log("failed to save seller fcm");
    }
  }

  async createUserwithPhone(number: any, code: any, fcmToken: string) {
    try {
      const user = await User.create({
        first_name: "",
        last_name: "",
        countrycode: code,
        phone: number,
        username: code + number,
        name: code + number,
        type: Role.User,
        role: Role.User,
        roles: [Role.User],
        active_role: Role.User,
        status: true,
        is_active: true,
        is_deleted: false,
        phone_verify: true,
        fcmtoken: fcmToken,
      });
      return user;
    } catch (error) {
      console.log("error", error);
      return null;
    }
  }
}
