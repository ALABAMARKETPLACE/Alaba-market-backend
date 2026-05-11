import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Op } from "sequelize";
import { BoosterPlanConfig } from "../SELLER_BOOSTER/booster-plan-config.entity";
import { User } from "../USERS/user.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Role } from "../shared/enum/role.enum";
import { normalizeRoles } from "../shared/helpers/user-role.helper";
import { AdminAuditLog } from "./admin-audit-log.entity";
import { MAX_SUPER_ADMINS } from "./super-admin.constants";
import { CreateBoosterPlanConfigDto } from "./dto/create-booster-plan-config.dto";
import { UpdateBoosterPlanConfigDto } from "./dto/update-booster-plan-config.dto";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";

type ActorContext = {
  actorId: number;
  actorRole: string;
  ipAddress?: string | null;
};

@Injectable()
export class SuperAdminService {
  constructor(
    @Inject("BoosterPlanConfigRepository")
    private readonly boosterPlanConfigRepository: typeof BoosterPlanConfig,
    @Inject("AdminAuditLogRepository")
    private readonly auditLogRepository: typeof AdminAuditLog,
    @Inject("UserRepository")
    private readonly userRepository: typeof User,
  ) {}

  async createBoosterPlanConfig(
    actor: ActorContext,
    payload: CreateBoosterPlanConfigDto,
  ): Promise<DataResponseDto> {
    this.assertSuperAdmin(actor.actorRole);
    this.validateConfigPayload(payload);

    const existing = await this.boosterPlanConfigRepository.findOne({
      where: { name: payload.name },
    } as any);
    if (existing) {
      throw new BadRequestException("Booster plan config already exists");
    }

    const created = await this.boosterPlanConfigRepository.create({
      ...payload,
      product_limit: payload.is_unlimited ? null : payload.product_limit,
      currency: payload.currency || "NGN",
      is_active: payload.is_active ?? true,
      is_unlimited: payload.is_unlimited ?? false,
      created_by: actor.actorId,
      updated_by: actor.actorId,
    } as any);

    await this.logAudit(actor, {
      action: "booster_config_created",
      module: "booster_plan_config",
      after_data: this.serializeConfig(created),
    });

    return new DataResponseDto(
      this.serializeConfig(created),
      true,
      "Booster plan config created",
    );
  }

  async listBoosterPlanConfigs(actor: ActorContext): Promise<DataResponseDto> {
    this.assertSuperAdmin(actor.actorRole);

    const configs = await this.boosterPlanConfigRepository.findAll({
      order: [["id", "ASC"]],
    } as any);

    return new DataResponseDto(
      configs.map((config) => this.serializeConfig(config)),
      true,
      "Booster plan configs retrieved",
    );
  }

  async updateBoosterPlanConfig(
    actor: ActorContext,
    id: number,
    payload: UpdateBoosterPlanConfigDto,
  ): Promise<DataResponseDto> {
    this.assertSuperAdmin(actor.actorRole);

    const config = await this.findConfig(id);
    const before = this.serializeConfig(config);
    const updatePayload: Record<string, any> = { ...payload };
    delete updatePayload.name;

    this.validateConfigPayload({
      ...before,
      ...updatePayload,
    } as CreateBoosterPlanConfigDto);

    if (updatePayload.is_unlimited === true) {
      updatePayload.product_limit = null;
    }

    updatePayload.updated_by = actor.actorId;
    await config.update(updatePayload);

    await this.logAudit(actor, {
      action: "booster_config_updated",
      module: "booster_plan_config",
      before_data: before,
      after_data: this.serializeConfig(config),
    });

    return new DataResponseDto(
      this.serializeConfig(config),
      true,
      "Booster plan config updated",
    );
  }

  async setBoosterPlanConfigActive(
    actor: ActorContext,
    id: number,
    isActive: boolean,
  ): Promise<DataResponseDto> {
    this.assertSuperAdmin(actor.actorRole);

    const config = await this.findConfig(id);
    const before = this.serializeConfig(config);
    await config.update({
      is_active: isActive,
      updated_by: actor.actorId,
    });

    await this.logAudit(actor, {
      action: isActive ? "booster_config_enabled" : "booster_config_disabled",
      module: "booster_plan_config",
      before_data: before,
      after_data: this.serializeConfig(config),
    });

    return new DataResponseDto(
      this.serializeConfig(config),
      true,
      isActive ? "Booster plan config enabled" : "Booster plan config disabled",
    );
  }

  async listUsers(actor: ActorContext): Promise<DataResponseDto> {
    this.assertSuperAdmin(actor.actorRole);

    const users = await this.userRepository.findAll({
      order: [["_id", "DESC"]],
    } as any);

    return new DataResponseDto(
      users.map((user) => this.serializeUser(user)),
      true,
      "Users retrieved",
    );
  }

  async listAdmins(actor: ActorContext): Promise<DataResponseDto> {
    this.assertSuperAdmin(actor.actorRole);

    const users = await this.userRepository.findAll({
      order: [["_id", "DESC"]],
    } as any);
    const admins = users.filter((user) => {
      const roles = normalizeRoles(user.roles, user.role);
      return roles.includes(Role.Admin) || roles.includes(Role.SuperAdmin);
    });

    return new DataResponseDto(
      admins.map((user) => this.serializeUser(user)),
      true,
      "Admins retrieved",
    );
  }

  async updateUserRole(
    actor: ActorContext,
    userId: number,
    payload: UpdateUserRoleDto,
  ): Promise<DataResponseDto> {
    this.assertCanManageUsers(actor.actorRole);

    const target = await this.findUser(userId);
    const before = this.serializeUser(target);
    const targetRoles = normalizeRoles(target.roles, target.role);
    const nextRole = this.normalizeAssignableRole(payload.role);

    if (
      actor.actorRole !== Role.SuperAdmin &&
      targetRoles.includes(Role.SuperAdmin)
    ) {
      throw new ForbiddenException("Admin cannot modify Super Admin users");
    }

    if (nextRole === Role.SuperAdmin) {
      this.assertSuperAdmin(actor.actorRole);
      if (!targetRoles.includes(Role.SuperAdmin)) {
        await this.assertCanAddSuperAdmin(target._id);
      }
    }

    if (
      targetRoles.includes(Role.SuperAdmin) &&
      nextRole !== Role.SuperAdmin
    ) {
      await this.assertNotLastActiveSuperAdmin(target._id);
    }

    const nextState = this.buildRoleState(nextRole);
    await target.update(nextState);

    await this.logAudit(actor, {
      action:
        nextRole === Role.Admin || nextRole === Role.SuperAdmin
          ? "admin_modified"
          : "user_role_changed",
      module: "user_management",
      target_user_id: target._id,
      before_data: before,
      after_data: this.serializeUser(target),
    });

    return new DataResponseDto(
      this.serializeUser(target),
      true,
      "User role updated",
    );
  }

  async updateUserStatus(
    actor: ActorContext,
    userId: number,
    payload: UpdateUserStatusDto,
  ): Promise<DataResponseDto> {
    this.assertCanManageUsers(actor.actorRole);

    const target = await this.findUser(userId);
    const targetRoles = normalizeRoles(target.roles, target.role);
    if (
      actor.actorRole !== Role.SuperAdmin &&
      targetRoles.includes(Role.SuperAdmin)
    ) {
      throw new ForbiddenException("Admin cannot modify Super Admin users");
    }

    const nextActive =
      payload.is_active !== undefined ? payload.is_active : payload.status;
    if (nextActive === undefined) {
      throw new BadRequestException("is_active or status is required");
    }

    if (!nextActive && targetRoles.includes(Role.SuperAdmin)) {
      await this.assertNotLastActiveSuperAdmin(target._id);
    }

    const before = this.serializeUser(target);
    await target.update({
      is_active: nextActive,
      status: nextActive,
      disabled_at: nextActive ? null : new Date(),
    });

    await this.logAudit(actor, {
      action: nextActive ? "user_enabled" : "user_disabled",
      module: "user_management",
      target_user_id: target._id,
      before_data: before,
      after_data: this.serializeUser(target),
    });

    return new DataResponseDto(
      this.serializeUser(target),
      true,
      nextActive ? "User enabled" : "User disabled",
    );
  }

  private async findConfig(id: number): Promise<BoosterPlanConfig> {
    const config = await this.boosterPlanConfigRepository.findByPk(id);
    if (!config) {
      throw new NotFoundException("Booster plan config not found");
    }

    return config;
  }

  private async findUser(userId: number): Promise<User> {
    const user = await this.userRepository.findByPk(userId);
    if (!user || user.is_deleted) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  private assertSuperAdmin(actorRole: string): void {
    if (actorRole !== Role.SuperAdmin) {
      throw new ForbiddenException("Only Super Admin can perform this action");
    }
  }

  private assertCanManageUsers(actorRole: string): void {
    if (![Role.SuperAdmin, Role.Admin].includes(actorRole as Role)) {
      throw new ForbiddenException("Only admins can manage users");
    }
  }

  private normalizeAssignableRole(role: Role): Role {
    if (role === Role.User || role === Role.Customer) {
      return Role.Customer;
    }

    if ([Role.Seller, Role.Admin, Role.SuperAdmin].includes(role)) {
      return role;
    }

    throw new BadRequestException("Invalid role");
  }

  private buildRoleState(role: Role): Record<string, any> {
    if (role === Role.SuperAdmin) {
      return {
        role: Role.SuperAdmin,
        roles: [Role.SuperAdmin],
        active_role: Role.SuperAdmin,
        type: Role.SuperAdmin,
      };
    }

    if (role === Role.Admin) {
      return {
        role: Role.Admin,
        roles: [Role.User, Role.Customer, Role.Admin],
        active_role: Role.Admin,
        type: Role.Admin,
      };
    }

    if (role === Role.Seller) {
      return {
        role: Role.Seller,
        roles: [Role.User, Role.Customer, Role.Seller],
        active_role: Role.Seller,
        type: Role.Seller,
      };
    }

    return {
      role: Role.User,
      roles: [Role.User, Role.Customer],
      active_role: Role.User,
      type: Role.User,
    };
  }

  private validateConfigPayload(
    payload: CreateBoosterPlanConfigDto | Record<string, any>,
  ): void {
    if (payload.is_unlimited) {
      return;
    }

    if (!Number(payload.product_limit || 0)) {
      throw new BadRequestException(
        "product_limit is required unless is_unlimited is true",
      );
    }
  }

  private async assertNotLastActiveSuperAdmin(targetUserId: number): Promise<void> {
    const users = await this.userRepository.findAll({
      where: {
        _id: { [Op.ne]: targetUserId },
        status: true,
        is_active: true,
        is_deleted: false,
      },
    } as any);

    const remainingSuperAdmins = users.filter((user) =>
      normalizeRoles(user.roles, user.role).includes(Role.SuperAdmin),
    );
    if (remainingSuperAdmins.length === 0) {
      throw new BadRequestException("Cannot disable the last Super Admin");
    }
  }

  private async assertCanAddSuperAdmin(targetUserId: number): Promise<void> {
    const users = await this.userRepository.findAll({
      where: {
        _id: { [Op.ne]: targetUserId },
        is_deleted: false,
      },
    } as any);

    const superAdminCount = users.filter((user) =>
      normalizeRoles(user.roles, user.role).includes(Role.SuperAdmin),
    ).length;

    if (superAdminCount >= MAX_SUPER_ADMINS) {
      throw new BadRequestException(
        `Only ${MAX_SUPER_ADMINS} Super Admin users are allowed`,
      );
    }
  }

  private async logAudit(
    actor: ActorContext,
    data: {
      target_user_id?: number;
      action: string;
      module: string;
      before_data?: Record<string, any> | null;
      after_data?: Record<string, any> | null;
    },
  ): Promise<void> {
    await this.auditLogRepository.create({
      actor_id: actor.actorId,
      actor_role: actor.actorRole,
      target_user_id: data.target_user_id || null,
      action: data.action,
      module: data.module,
      before_data: data.before_data || null,
      after_data: data.after_data || null,
      ip_address: actor.ipAddress || null,
      created_at: new Date(),
    } as any);
  }

  private serializeConfig(config: BoosterPlanConfig): Record<string, any> {
    return {
      id: config.id,
      name: config.name,
      display_name: config.display_name,
      description: config.description,
      product_limit: config.product_limit,
      boost_score: config.boost_score,
      duration_days: config.duration_days,
      price: config.price,
      currency: config.currency,
      is_active: config.is_active,
      is_unlimited: config.is_unlimited,
      created_by: config.created_by,
      updated_by: config.updated_by,
      created_at: (config as any).created_at,
      updated_at: (config as any).updated_at,
    };
  }

  private serializeUser(user: User): Record<string, any> {
    return {
      id: user._id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      roles: normalizeRoles(user.roles, user.role),
      active_role: user.active_role,
      type: user.type,
      store_id: user.store_id,
      status: user.status,
      is_active: user.is_active,
      is_deleted: user.is_deleted,
      disabled_at: user.disabled_at,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    };
  }
}
