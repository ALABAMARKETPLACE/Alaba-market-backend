import { afterEach, describe, expect, it, jest } from "@jest/globals";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

import { AuthService } from "./auth.service";
import { User } from "../USERS/user.entity";
import { Role } from "../shared/enum/role.enum";

describe("AuthService admin password reset", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.ADMIN_FRONTEND_URL;
    delete process.env.NAME;
  });

  const createUser = (overrides: Partial<User> = {}) => {
    const user: any = {
      _id: 42,
      email: "admin@example.com",
      name: "Admin User",
      first_name: "Admin",
      password: "old-hash",
      role: Role.Admin,
      roles: [Role.Admin],
      active_role: Role.Admin,
      status: true,
      is_active: true,
      is_deleted: false,
      password_reset_token_hash: null,
      password_reset_expires_at: null,
      password_changed_at: null,
      save: jest.fn(async function save() {
        return this;
      }),
      ...overrides,
    };

    return user as User & { save: any };
  };

  const createService = () => {
    const mailService = {
      AuthMail: jest.fn(async () => undefined),
    };
    const tokenService = {
      signoutFromAll: jest.fn(async () => []),
    };
    const hashPassword = jest.fn(async (password: string) => {
      return bcrypt.hash(password, 10);
    });

    const service = new AuthService(
      mailService as any,
      jest.fn() as any,
      jest.fn() as any,
      hashPassword as any,
      tokenService as any,
      {} as any,
      {} as any,
      {} as any,
    );

    return { service, mailService, tokenService, hashPassword };
  };

  const hashToken = (token: string) =>
    crypto.createHash("sha256").update(token).digest("hex");

  it("forgot password returns the generic response when email does not exist", async () => {
    const { service, mailService } = createService();
    jest.spyOn(User, "findOne").mockResolvedValue(null);

    const result = await service.adminForgotPassword({
      email: "missing@example.com",
    });

    expect(result.status).toBe(true);
    expect(result.message).toBe(
      "If this email exists, a password reset link has been sent.",
    );
    expect(mailService.AuthMail).not.toHaveBeenCalled();
  });

  it("hashes the reset token before storing it", async () => {
    const { service, mailService } = createService();
    const user = createUser();
    jest.spyOn(User, "findOne").mockResolvedValue(user);

    await service.adminForgotPassword({ email: "ADMIN@example.com" });

    const mailPayload = (mailService.AuthMail as any).mock.calls[0][0];
    const tokenMatch = String(mailPayload.template).match(/token=([^"&<]+)/);
    const rawToken = decodeURIComponent(tokenMatch?.[1] || "");

    expect(rawToken).toHaveLength(64);
    expect(user.password_reset_token_hash).toBe(hashToken(rawToken));
    expect(user.password_reset_token_hash).not.toBe(rawToken);
    expect(user.password_reset_expires_at).toBeInstanceOf(Date);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(mailService.AuthMail).toHaveBeenCalledTimes(1);
  });

  it("sends a reset link for a logged-in admin password change request", async () => {
    const { service, mailService } = createService();
    const user = createUser();
    jest.spyOn(User, "findByPk").mockResolvedValue(user);

    const result = await service.requestAdminPasswordChange(42);

    const mailPayload = (mailService.AuthMail as any).mock.calls[0][0];
    const tokenMatch = String(mailPayload.template).match(/token=([^"&<]+)/);
    const rawToken = decodeURIComponent(tokenMatch?.[1] || "");

    expect(result.status).toBe(true);
    expect(result.message).toBe(
      "Password reset link has been sent to your email.",
    );
    expect(user.password_reset_token_hash).toBe(hashToken(rawToken));
    expect(user.password_reset_expires_at).toBeInstanceOf(Date);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(mailService.AuthMail).toHaveBeenCalledTimes(1);
  });

  it("does not send logged-in password change links for non-admin users", async () => {
    const { service, mailService } = createService();
    const user = createUser({
      role: Role.User,
      roles: [Role.User],
      active_role: Role.User,
    });
    jest.spyOn(User, "findByPk").mockResolvedValue(user);

    await expect(service.requestAdminPasswordChange(42)).rejects.toThrow(
      "Only admins can request this reset link",
    );

    expect(user.password_reset_token_hash).toBeNull();
    expect(user.save).not.toHaveBeenCalled();
    expect(mailService.AuthMail).not.toHaveBeenCalled();
  });

  it("supports super admin password reset requests", async () => {
    const { service, mailService } = createService();
    const user = createUser({
      role: Role.SuperAdmin,
      roles: [Role.SuperAdmin],
      active_role: Role.SuperAdmin,
    });
    jest.spyOn(User, "findOne").mockResolvedValue(user);

    await service.adminForgotPassword({ email: "admin@example.com" });

    expect(user.password_reset_token_hash).not.toBeNull();
    expect(mailService.AuthMail).toHaveBeenCalledTimes(1);
  });

  it("resets password with a valid token and stores a bcrypt hash", async () => {
    const { service, tokenService } = createService();
    const token = "valid-reset-token";
    const user = createUser({
      password_reset_token_hash: hashToken(token),
      password_reset_expires_at: new Date(Date.now() + 60_000),
    });
    jest.spyOn(User, "findOne").mockResolvedValue(user);

    const result = await service.adminResetPassword({
      token,
      newPassword: "NewStrongPassword123!",
    });

    expect(result.status).toBe(true);
    expect(await bcrypt.compare("NewStrongPassword123!", user.password)).toBe(true);
    expect(user.password_reset_token_hash).toBeNull();
    expect(user.password_reset_expires_at).toBeNull();
    expect(user.password_changed_at).toBeInstanceOf(Date);
    expect(tokenService.signoutFromAll).toHaveBeenCalledWith(42);
  });

  it("rejects an expired token", async () => {
    const { service } = createService();
    const token = "expired-reset-token";
    const user = createUser({
      password_reset_token_hash: hashToken(token),
      password_reset_expires_at: new Date(Date.now() - 1_000),
    });
    jest.spyOn(User, "findOne").mockResolvedValue(user);

    await expect(
      service.adminResetPassword({
        token,
        newPassword: "NewStrongPassword123!",
      }),
    ).rejects.toThrow("Invalid or expired password reset token");
  });

  it("does not allow a reset token to be reused", async () => {
    const { service } = createService();
    const token = "single-use-token";
    const user = createUser({
      password_reset_token_hash: hashToken(token),
      password_reset_expires_at: new Date(Date.now() + 60_000),
    });
    const findOne = jest
      .spyOn(User, "findOne")
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(null);

    await service.adminResetPassword({
      token,
      newPassword: "NewStrongPassword123!",
    });

    await expect(
      service.adminResetPassword({
        token,
        newPassword: "AnotherStrongPassword123!",
      }),
    ).rejects.toThrow("Invalid or expired password reset token");
    expect(findOne).toHaveBeenCalledTimes(2);
  });

  it("does not reset password for deleted or inactive admins", async () => {
    const { service, hashPassword } = createService();
    const token = "inactive-admin-token";
    const user = createUser({
      is_deleted: true,
      password_reset_token_hash: hashToken(token),
      password_reset_expires_at: new Date(Date.now() + 60_000),
    });
    jest.spyOn(User, "findOne").mockResolvedValue(user);

    await expect(
      service.adminResetPassword({
        token,
        newPassword: "NewStrongPassword123!",
      }),
    ).rejects.toThrow("Invalid or expired password reset token");
    expect(hashPassword).not.toHaveBeenCalled();
  });

  it("does not generate a reset token for inactive admins", async () => {
    const { service, mailService } = createService();
    const user = createUser({ status: false, is_active: false });
    jest.spyOn(User, "findOne").mockResolvedValue(user);

    const result = await service.adminForgotPassword({
      email: "admin@example.com",
    });

    expect(result.message).toBe(
      "If this email exists, a password reset link has been sent.",
    );
    expect(user.password_reset_token_hash).toBeNull();
    expect(user.save).not.toHaveBeenCalled();
    expect(mailService.AuthMail).not.toHaveBeenCalled();
  });
});
