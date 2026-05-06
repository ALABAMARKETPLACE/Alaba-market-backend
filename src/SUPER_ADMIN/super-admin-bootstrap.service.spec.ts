import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Role } from "../shared/enum/role.enum";
import { SuperAdminBootstrapService } from "./super-admin-bootstrap.service";

describe("SuperAdminBootstrapService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.SUPER_ADMIN_EMAIL;
    delete process.env.SUPER_ADMIN_PASSWORD;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
  });

  const createUser = (overrides: Record<string, any> = {}) => {
    const user: any = {
      _id: 10,
      email: "owner@example.com",
      role: Role.Admin,
      roles: [Role.User, Role.Admin],
      active_role: Role.Admin,
      type: Role.Admin,
      status: true,
      is_active: true,
      is_deleted: false,
      save: jest.fn(async function save() {
        return this;
      }),
      ...overrides,
    };

    return user;
  };

  const createService = (overrides: Record<string, any> = {}) => {
    const userRepository = {
      findOne: jest.fn(async () => null),
      findAll: jest.fn(async () => []),
      create: jest.fn(async (payload: any) => createUser(payload)),
      ...overrides.userRepository,
    };
    const hashPassword = jest.fn(async (password: string) => `hashed:${password}`);
    const service = new SuperAdminBootstrapService(
      userRepository as any,
      hashPassword as any,
    );

    jest.spyOn((service as any).logger, "log").mockImplementation(() => undefined);
    jest.spyOn((service as any).logger, "warn").mockImplementation(() => undefined);

    return { service, userRepository, hashPassword };
  };

  it("promotes the env admin user to Super Admin on startup", async () => {
    process.env.SUPER_ADMIN_EMAIL = "OWNER@example.com";
    const user = createUser({ email: "owner@example.com" });
    const { service, userRepository } = createService({
      userRepository: {
        findOne: jest.fn(async () => user),
        findAll: jest.fn(async () => []),
      },
    });

    await service.ensureEnvSuperAdmin();

    expect(userRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "owner@example.com" },
      }),
    );
    expect(user.role).toBe(Role.SuperAdmin);
    expect(user.roles).toEqual([Role.SuperAdmin]);
    expect(user.active_role).toBe(Role.SuperAdmin);
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  it("creates the env Super Admin when missing and password is configured", async () => {
    process.env.SUPER_ADMIN_EMAIL = "owner@example.com";
    process.env.SUPER_ADMIN_PASSWORD = "StrongPassword123!";
    const { service, userRepository, hashPassword } = createService();

    await service.ensureEnvSuperAdmin();

    expect(hashPassword).toHaveBeenCalledWith("StrongPassword123!");
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "owner@example.com",
        role: Role.SuperAdmin,
        roles: [Role.SuperAdmin],
        active_role: Role.SuperAdmin,
        status: true,
        is_active: true,
      }),
    );
  });

  it("does not create a third Super Admin from env", async () => {
    process.env.SUPER_ADMIN_EMAIL = "owner@example.com";
    process.env.SUPER_ADMIN_PASSWORD = "StrongPassword123!";
    const superAdminA = createUser({
      _id: 1,
      role: Role.SuperAdmin,
      roles: [Role.SuperAdmin],
    });
    const superAdminB = createUser({
      _id: 2,
      role: Role.SuperAdmin,
      roles: [Role.SuperAdmin],
    });
    const { service, userRepository } = createService({
      userRepository: {
        findOne: jest.fn(async () => null),
        findAll: jest.fn(async () => [superAdminA, superAdminB]),
        create: jest.fn(async () => createUser()),
      },
    });

    await service.ensureEnvSuperAdmin();

    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
