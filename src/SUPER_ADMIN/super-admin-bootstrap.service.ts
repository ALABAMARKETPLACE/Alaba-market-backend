import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { generateFromEmail } from "unique-username-generator";
import { User } from "../USERS/user.entity";
import { Role } from "../shared/enum/role.enum";
import { normalizeRoles } from "../shared/helpers/user-role.helper";
import {
  MAX_SUPER_ADMINS,
  SUPER_ADMIN_ENV_EMAIL_KEYS,
  SUPER_ADMIN_ENV_PASSWORD_KEYS,
} from "./super-admin.constants";

@Injectable()
export class SuperAdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminBootstrapService.name);

  constructor(
    @Inject("UserRepository")
    private readonly userRepository: typeof User,
    @Inject("hashPassword")
    private readonly hashPassword: (password: string) => Promise<string>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureEnvSuperAdmin();
  }

  async ensureEnvSuperAdmin(): Promise<User | null> {
    const email = this.firstEnvValue(SUPER_ADMIN_ENV_EMAIL_KEYS);
    if (!email) {
      return null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    } as any);

    if (existing) {
      return this.promoteExistingEnvUser(existing);
    }

    const currentCount = await this.countSuperAdmins();
    if (currentCount >= MAX_SUPER_ADMINS) {
      this.logger.warn(
        `Skipping env Super Admin creation for ${normalizedEmail}: limit is ${MAX_SUPER_ADMINS}`,
      );
      return null;
    }

    const password = this.firstEnvValue(SUPER_ADMIN_ENV_PASSWORD_KEYS);
    if (!password) {
      this.logger.warn(
        `Skipping env Super Admin creation for ${normalizedEmail}: SUPER_ADMIN_PASSWORD is not set`,
      );
      return null;
    }

    const created = await this.userRepository.create({
      username:
        process.env.SUPER_ADMIN_USERNAME ||
        `${generateFromEmail(normalizedEmail, 4)}-super-admin`,
      password: await this.hashPassword(password),
      first_name: process.env.SUPER_ADMIN_FIRST_NAME || "Super",
      last_name: process.env.SUPER_ADMIN_LAST_NAME || "Admin",
      name:
        process.env.SUPER_ADMIN_NAME ||
        `${process.env.SUPER_ADMIN_FIRST_NAME || "Super"} ${
          process.env.SUPER_ADMIN_LAST_NAME || "Admin"
        }`,
      email: normalizedEmail,
      countrycode: process.env.SUPER_ADMIN_COUNTRY_CODE || "",
      phone: process.env.SUPER_ADMIN_PHONE || null,
      type: Role.SuperAdmin,
      role: Role.SuperAdmin,
      roles: [Role.SuperAdmin],
      active_role: Role.SuperAdmin,
      mail_verify: true,
      phone_verify: true,
      status: true,
      is_active: true,
      is_deleted: false,
      image:
        process.env.SUPER_ADMIN_IMAGE ||
        "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/profileicon.png",
    } as any);

    this.logger.log(`Created env Super Admin user ${normalizedEmail}`);
    return created;
  }

  private async promoteExistingEnvUser(user: User): Promise<User> {
    const roles = normalizeRoles(user.roles, user.role);
    if (roles.includes(Role.SuperAdmin)) {
      return user;
    }

    const currentCount = await this.countSuperAdmins();
    if (currentCount >= MAX_SUPER_ADMINS) {
      this.logger.warn(
        `Skipping env Super Admin promotion for ${user.email}: limit is ${MAX_SUPER_ADMINS}`,
      );
      return user;
    }

    user.role = Role.SuperAdmin;
    user.roles = [Role.SuperAdmin];
    user.active_role = Role.SuperAdmin;
    user.type = Role.SuperAdmin;
    user.status = true;
    user.is_active = true;
    user.is_deleted = false;
    await user.save();

    this.logger.log(`Promoted env user ${user.email} to Super Admin`);
    return user;
  }

  private async countSuperAdmins(): Promise<number> {
    const users = await this.userRepository.findAll({
      where: { is_deleted: false },
    } as any);

    return users.filter((user) =>
      normalizeRoles(user.roles, user.role).includes(Role.SuperAdmin),
    ).length;
  }

  private firstEnvValue(keys: string[]): string {
    for (const key of keys) {
      const value = process.env[key];
      if (value && value.trim()) {
        return value.trim();
      }
    }

    return "";
  }
}
