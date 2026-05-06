import {
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { describe, expect, it, jest } from "@jest/globals";
import { Role } from "../shared/enum/role.enum";
import { SuperAdminService } from "./super-admin.service";

describe("SuperAdminService", () => {
  const actor = {
    actorId: 1,
    actorRole: Role.SuperAdmin,
    ipAddress: "127.0.0.1",
  };

  const createConfig = (overrides: Record<string, any> = {}) => {
    const config: any = {
      id: 1,
      name: "basic",
      display_name: "Basic",
      description: "Boost up to 5 selected active products.",
      product_limit: 5,
      boost_score: 30,
      duration_days: 30,
      price: 500000,
      currency: "NGN",
      is_active: true,
      is_unlimited: false,
      created_by: 1,
      updated_by: 1,
      update: jest.fn(async (payload: Record<string, any>) => {
        Object.assign(config, payload);
        return config;
      }),
      ...overrides,
    };
    return config;
  };

  const createUser = (overrides: Record<string, any> = {}) => {
    const user: any = {
      _id: 12,
      username: "user12",
      first_name: "User",
      last_name: "Twelve",
      name: "User Twelve",
      email: "user12@example.com",
      phone: "08000000000",
      role: Role.User,
      roles: [Role.User],
      active_role: Role.User,
      type: Role.User,
      store_id: null,
      status: true,
      is_active: true,
      is_deleted: false,
      disabled_at: null,
      update: jest.fn(async (payload: Record<string, any>) => {
        Object.assign(user, payload);
        return user;
      }),
      ...overrides,
    };
    return user;
  };

  const createService = (overrides: Record<string, any> = {}) => {
    const boosterPlanConfigRepository = {
      create: jest.fn(async (payload: any) => createConfig(payload)),
      findAll: jest.fn(async () => []),
      findOne: jest.fn(async () => null),
      findByPk: jest.fn(async () => createConfig()),
      ...overrides.boosterPlanConfigRepository,
    };
    const auditLogRepository = {
      create: jest.fn(async () => ({})),
      ...overrides.auditLogRepository,
    };
    const userRepository = {
      findAll: jest.fn(async () => []),
      findByPk: jest.fn(async () => createUser()),
      ...overrides.userRepository,
    };
    const service = new SuperAdminService(
      boosterPlanConfigRepository as any,
      auditLogRepository as any,
      userRepository as any,
    );

    return {
      service,
      boosterPlanConfigRepository,
      auditLogRepository,
      userRepository,
    };
  };

  it("allows Super Admin to edit Basic product_limit", async () => {
    const config = createConfig();
    const { service, auditLogRepository } = createService({
      boosterPlanConfigRepository: {
        findByPk: jest.fn(async () => config),
      },
    });

    const result = await service.updateBoosterPlanConfig(actor, 1, {
      product_limit: 8,
    });

    expect(config.update).toHaveBeenCalledWith(
      expect.objectContaining({ product_limit: 8, updated_by: 1 }),
    );
    expect(result.data.product_limit).toBe(8);
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "booster_config_updated",
        module: "booster_plan_config",
      }),
    );
  });

  it("rejects Admin booster config edits", async () => {
    const { service } = createService();

    await expect(
      service.updateBoosterPlanConfig(
        { actorId: 2, actorRole: Role.Admin },
        1,
        { product_limit: 8 },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("prevents Admin from assigning Super Admin role", async () => {
    const { service } = createService({
      userRepository: {
        findByPk: jest.fn(async () => createUser()),
      },
    });

    await expect(
      service.updateUserRole(
        { actorId: 2, actorRole: Role.Admin },
        12,
        { role: Role.SuperAdmin },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows Super Admin to promote one database admin to Super Admin", async () => {
    const target = createUser({
      role: Role.Admin,
      roles: [Role.User, Role.Admin],
      active_role: Role.Admin,
    });
    const existingSuperAdmin = createUser({
      _id: 1,
      role: Role.SuperAdmin,
      roles: [Role.SuperAdmin],
      active_role: Role.SuperAdmin,
    });
    const { service } = createService({
      userRepository: {
        findByPk: jest.fn(async () => target),
        findAll: jest.fn(async () => [existingSuperAdmin]),
      },
    });

    const result = await service.updateUserRole(actor, 12, {
      role: Role.SuperAdmin,
    });

    expect(target.update).toHaveBeenCalledWith(
      expect.objectContaining({
        role: Role.SuperAdmin,
        roles: [Role.SuperAdmin],
        active_role: Role.SuperAdmin,
      }),
    );
    expect(result.data.role).toBe(Role.SuperAdmin);
  });

  it("prevents creating a third Super Admin", async () => {
    const target = createUser({
      role: Role.Admin,
      roles: [Role.User, Role.Admin],
      active_role: Role.Admin,
    });
    const superAdminA = createUser({
      _id: 1,
      role: Role.SuperAdmin,
      roles: [Role.SuperAdmin],
      active_role: Role.SuperAdmin,
    });
    const superAdminB = createUser({
      _id: 2,
      role: Role.SuperAdmin,
      roles: [Role.SuperAdmin],
      active_role: Role.SuperAdmin,
    });
    const { service } = createService({
      userRepository: {
        findByPk: jest.fn(async () => target),
        findAll: jest.fn(async () => [superAdminA, superAdminB]),
      },
    });

    await expect(
      service.updateUserRole(actor, 12, { role: Role.SuperAdmin }),
    ).rejects.toThrow("Only 2 Super Admin users are allowed");

    expect(target.update).not.toHaveBeenCalled();
  });

  it("prevents disabling the last Super Admin", async () => {
    const superAdmin = createUser({
      _id: 1,
      role: Role.SuperAdmin,
      roles: [Role.SuperAdmin],
      active_role: Role.SuperAdmin,
    });
    const { service } = createService({
      userRepository: {
        findByPk: jest.fn(async () => superAdmin),
        findAll: jest.fn(async () => []),
      },
    });

    await expect(
      service.updateUserStatus(actor, 1, { is_active: false }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("prevents Admin from changing Super Admin role or status", async () => {
    const superAdmin = createUser({
      role: Role.SuperAdmin,
      roles: [Role.SuperAdmin],
      active_role: Role.SuperAdmin,
    });
    const { service } = createService({
      userRepository: {
        findByPk: jest.fn(async () => superAdmin),
      },
    });

    await expect(
      service.updateUserRole(
        { actorId: 2, actorRole: Role.Admin },
        12,
        { role: Role.Admin },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.updateUserStatus(
        { actorId: 2, actorRole: Role.Admin },
        12,
        { is_active: false },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
