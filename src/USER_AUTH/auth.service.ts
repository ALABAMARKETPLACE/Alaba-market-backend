import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { compare } from "bcrypt";
import * as crypto from "crypto";
import verifyAppleToken from "verify-apple-id-token";
import {
  login_Request,
  login_phone,
  login_google,
  login_apple,
} from "./dto/login.dto";
import { signup_Request } from "./dto/signup.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { MailService } from "../MAILS/Mails.services";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { VerifyUserTokenDto } from "./dto/verifyToken.dto";
import { User } from "../USERS/user.entity";
import { ChangePasswordDto } from "./dto/changePassword.dto";
import { ForgotPasswordDto } from "./dto/forgotPassword.dto";
import { AdminForgotPasswordDto } from "./dto/admin-forgot-password.dto";
import { AdminResetPasswordDto } from "./dto/admin-reset-password.dto";
import {
  UnifiedChangePasswordDto,
  UnifiedForgotPasswordDto,
  UnifiedResetPasswordDto,
} from "./dto/password-management.dto";
import { DeactivateAccountDto } from "./dto/deactivateAccount.dto";
const SignupHtml = require("../MAILS/templates/auth/SignupHtml");
const VerifyMail = require("../MAILS/templates/auth/mailVerfication");
const AdminForgotPasswordMail = require("../MAILS/templates/auth/adminForgotPassword");
const PasswordChangedMail = require("../MAILS/templates/auth/passwordChanged");
const DeactivateAccountViaMail = require("../MAILS/templates/auth/deactivateByMail");
const DeactivateMail = require("../MAILS/templates/auth/deactivate");
import { TokenManagementService } from "../TOKEN_MANAGEMENT/services";
import { RefreshTokenDto } from "./dto/refresh_token.dto";
import { AuthRepository } from "./auth.repository";
import { FirebaseService } from "../FIREBASE/firebase.service";
import { JwtService } from "@nestjs/jwt";
import { Op } from "sequelize";
import { Role } from "../shared/enum/role.enum";
import { AdminAuditLog } from "../SUPER_ADMIN/admin-audit-log.entity";

type VerifyTokenPurpose =
  | "email_verification"
  | "password_reset"
  | "account_deactivation"
  | "admin_invitation";

const PASSWORD_RESET_SUCCESS_MESSAGE =
  "If this email exists, a reset code has been sent";
const PASSWORD_RESET_EXPIRY_MINUTES = 15;
const FORGOT_PASSWORD_LIMIT = 5;
const FORGOT_PASSWORD_WINDOW_MS = 15 * 60 * 1000;
const RESET_PASSWORD_LIMIT = 5;
const RESET_PASSWORD_WINDOW_MS = 15 * 60 * 1000;
const CHANGE_PASSWORD_LIMIT = 6;
const CHANGE_PASSWORD_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private mailService: MailService,
    @Inject("CreateToken")
    private createToken: (user: User, fid: number) => Promise<string | null>,
    @Inject("CreateVerifyToken")
    private createVerifyToken: (
      userId: number,
      purpose?: VerifyTokenPurpose,
    ) => Promise<string | null>,
    @Inject("hashPassword")
    private hashPassword: (password: string) => Promise<string>,
    private readonly tokenService: TokenManagementService,
    private readonly authRepo: AuthRepository,
    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
    @Inject("AdminAuditLogRepository")
    private readonly adminAuditLogRepository?: typeof AdminAuditLog,
  ) {}

  private async createScopedVerifyToken(
    userId: number,
    purpose: VerifyTokenPurpose,
  ): Promise<string> {
    const token = await this.createVerifyToken(userId, purpose);

    if (!token) {
      throw new InternalServerErrorException("Failed to create verification token");
    }

    return token;
  }

  private verifyScopedToken(token: string, expectedPurpose: VerifyTokenPurpose) {
    const verified: any = this.jwtService.verify(token);
    const actualPurpose = verified?.data?.purpose;

    if (actualPurpose && actualPurpose !== expectedPurpose) {
      throw new UnauthorizedException("Invalid token for requested action");
    }

    if (!verified?.data?.userId) {
      throw new UnauthorizedException("Invalid token payload");
    }

    return verified;
  }

  private normalizeEmail(email: string): string {
    return String(email || "").trim().toLowerCase();
  }

  private createPasswordResetToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  private hashPasswordResetToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private hashRateLimitValue(value: string) {
    return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
  }

  private requestMeta(request?: any) {
    const forwardedFor = request?.headers?.["x-forwarded-for"];
    const ipAddress = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : String(forwardedFor || request?.ip || request?.socket?.remoteAddress || "")
          .split(",")[0]
          .trim();

    return {
      ipAddress: ipAddress || null,
      userAgent: request?.headers?.["user-agent"] || null,
    };
  }

  private async assertRateLimit(
    key: string,
    limit: number,
    ttlMs: number,
    message = "Too many attempts. Please try again later.",
  ) {
    if (!this.cacheManager) return;

    const current = Number((await this.cacheManager.get<number>(key)) || 0);
    if (current >= limit) {
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.cacheManager.set(key, current + 1, ttlMs);
  }

  private assertPasswordConfirmed(newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) {
      throw new ConflictException("Password confirmation does not match");
    }
  }

  private async assertPasswordNotReused(user: User, newPassword: string) {
    if (!user.password) return;

    const isReused = await compare(newPassword, user.password);
    if (isReused) {
      throw new ConflictException("Please choose a password you have not used before");
    }
  }

  private async writePasswordActivityLog({
    actorId,
    actorRole,
    targetUserId,
    action,
    metadata,
    request,
  }: {
    actorId?: number | null;
    actorRole?: string | null;
    targetUserId?: number | null;
    action: string;
    metadata?: Record<string, any> | null;
    request?: any;
  }) {
    if (!this.adminAuditLogRepository) return;

    const meta = this.requestMeta(request);
    try {
      await this.adminAuditLogRepository.create({
        actor_id: actorId || 0,
        actor_role: actorRole || "system",
        target_user_id: targetUserId || null,
        action,
        module: "password",
        before_data: null,
        after_data: metadata || null,
        ip_address: meta.ipAddress,
      } as any);
    } catch (err) {
      console.log("Failed to write password activity log", err?.message || err);
    }
  }

  private resolvePrimaryRole(user: User | null): string {
    if (!user) return "unknown";
    return user.active_role || user.role || "user";
  }

  private userHasAdminRole(user: User | null): boolean {
    if (!user) return false;

    const roles = Array.isArray(user.roles) ? user.roles : [];
    return (
      user.role === Role.Admin ||
      user.role === Role.SuperAdmin ||
      user.active_role === Role.Admin ||
      user.active_role === Role.SuperAdmin ||
      roles.includes(Role.Admin) ||
      roles.includes(Role.SuperAdmin)
    );
  }

  private assertUserCanAuthenticate(
    user: User | null,
    notFoundMessage?: string,
  ) {
    if (!user) {
      throw new NotFoundException(notFoundMessage ?? "User not found");
    }

    if (user.is_deleted) {
      throw new UnauthorizedException("This account has been deleted");
    }

    if ((user.is_active ?? user.status) !== true || user.status !== true) {
      throw new UnauthorizedException("Your Account is Deactivated");
    }

    return user;
  }

  async signup(body: signup_Request) {
    try {
      // COMMENTED: Firebase OTP verification disabled
      // let userD = null;
      // if (body?.idToken && body.idToken.toLowerCase().includes("session")) {
      //   console.log("Contains session");
      // } else {
      //   userD = await this.firebaseService.verifyIdToken(body.idToken);
      // }
      // // if (!userD?.phone_number) throw new UnauthorizedException();
      // const phone =
      //   userD?.phone_number?.replace(body.countrycode, "")?.trim() ||
      //   body?.phone;

      // Direct signup without Firebase token verification
      const phone = body?.phone;

      console.log({ body });

      const exist = await this.authRepo.checkUserExist(body?.email, phone);
      console.log({exist})
      if (exist) throw new ConflictException("User Already Exist.");
      const user = await this.authRepo.createNewUser(body, phone);
      console.log({user})
      if (!user)
        throw new InternalServerErrorException("Failed to Create Account..");
      const [refresh, fid] = await this.tokenService.createToken(user._id);
      const token = await this.createToken(user, fid);
      let Mail = await SignupHtml(user, token);
      console.log({Mail})
      this.mailService.AuthMail(Mail);
      const message = "Account created successfully.";
      return new DataResponseDto(user, true, message, token, refresh, true);
    } catch (err) {
      console.log(err)
      let message = `signup Faild. Please try again, ${getErrorMessage(err)}`;
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(message);
    }
  }

  async emailLogin(body: login_Request) {
    try {
      console.log("=== AUTH SERVICE EMAIL LOGIN ===");
      console.log("Login body received:", JSON.stringify(body, null, 2));

      const { email, password, fcmtoken, seller_fcmtoken } = body;
      console.log("Extracted email:", email);
      console.log("Password provided:", password ? "YES" : "NO");

      const user = await this.authRepo.findUserbyEmail(email);
      console.log("User found:", user ? "YES" : "NO");
      if (user) {
        console.log("User ID:", user._id);
        console.log("User status:", user.status);
        console.log("Has password:", user?.password ? "YES" : "NO");
      }

      this.assertUserCanAuthenticate(user, `No User found for ${email}`);
      if (!user?.password)
        throw new UnauthorizedException("No Password Found. use Google Login.");

      console.log("Comparing passwords...");
      const isMatch = await compare(password, user?.password ?? "");
      console.log("Password match:", isMatch);

      if (!isMatch) throw new UnauthorizedException("Incorrect Password..");

      console.log("Password verified, creating tokens...");
      await this.authRepo.saveFcm(fcmtoken, user?._id);
      if (seller_fcmtoken)
        await this.authRepo.saveSellerFcm(seller_fcmtoken, user.store_id);
      const [refresh, fid] = await this.tokenService.createToken(user._id);
      const token = await this.createToken(user, fid);
      let message = "Login Successfull";
      console.log("Login successful, returning response");
      return new DataResponseDto(user, true, message, token, refresh);
    } catch (err) {
      console.log("=== LOGIN ERROR ===");
      console.log("Error type:", err.constructor.name);
      console.log("Error message:", err.message);
      console.log("Error stack:", err.stack);

      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  async phoneLogin(body: login_phone) {
    try {
      const userD = await this.firebaseService.verifyIdToken(body.idToken);
      if (!userD?.phone_number) throw new UnauthorizedException();
      const phoneNumber = userD?.phone_number?.replace(body.code, "");
      const user = await this.authRepo.findUserbyPhone(phoneNumber, body.code);
      if (!user) {
        const newuser = await this.authRepo.createUserwithPhone(
          phoneNumber,
          body.code,
          body?.fcmtoken,
        );
        const [refresh, fid] = await this.tokenService.createToken(
          newuser?._id,
        );
        const token = await this.createToken(newuser, fid);
        let message = "Login Successfull";
        return new DataResponseDto(newuser, true, message, token, refresh);
      } else {
        this.assertUserCanAuthenticate(user, "Account not found");
        if (body?.fcmtoken) {
          await this.authRepo.saveFcm(body.fcmtoken, user._id);
        }
        const [refresh, fid] = await this.tokenService.createToken(user._id);
        const token = await this.createToken(user, fid);
        let message = "Login Successfull";
        return new DataResponseDto(user, true, message, token, refresh);
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  async googleLogin(body: login_google) {
    try {
      const guser = await this.firebaseService.verifyIdToken(body.idToken);
      if (!guser?.email) throw new UnauthorizedException();
      const user = await this.authRepo.findUserbyEmail(guser?.email);
      if (user) {
        this.assertUserCanAuthenticate(user);
        const [refresh, fid] = await this.tokenService.createToken(user._id);
        const token = await this.createToken(user, fid);
        const message = "Login Successful";
        return new DataResponseDto(user, true, message, token, refresh);
      }
      const newuser = await this.authRepo.createUserwithGmail(guser);
      if (!newuser)
        throw new InternalServerErrorException("Failed to Create Account.");
      let Mail = await SignupHtml(newuser, null);
      this.mailService.AuthMail(Mail);
      const [refresh, fid] = await this.tokenService.createToken(newuser._id);
      const token = await this.createToken(newuser, fid);
      const message = "Login Successfull";
      return new DataResponseDto(newuser, true, message, token, refresh, true);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  async appleLogin(body: login_apple) {
    try {
      const userDetails = await verifyAppleToken({
        idToken: body.idToken,
        clientId: process.env.APPLE_CLIENT_ID,
      });
      if (!userDetails.email) throw new UnauthorizedException();
      const user = await this.authRepo.findUserbyEmail(userDetails?.email);
      if (user) {
        this.assertUserCanAuthenticate(user);
        const [refresh, fid] = await this.tokenService.createToken(user._id);
        const token = await this.createToken(user, fid);
        const message = "Login Successful";
        return new DataResponseDto(user, true, message, token, refresh);
      }
      const newuser = await this.authRepo.createUserwithAppleId(userDetails);
      if (!newuser)
        throw new InternalServerErrorException("Failed to Create Account.");
      let Mail = await SignupHtml(newuser, null);
      this.mailService.AuthMail(Mail);
      const [refresh, fid] = await this.tokenService.createToken(newuser._id);
      const token = await this.createToken(newuser, fid);
      const message = "Login Successfull";
      return new DataResponseDto(newuser, true, message, token, refresh, true);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  async verifyEmail(userId: number) {
    try {
      const userDetails: any = await User.findByPk(userId);
      if (!userDetails) throw new NotFoundException();
      if (userDetails?.mail_verify == true) {
        return new DataResponseDto({}, false, "Email is already verified");
      }
      const token = await this.createScopedVerifyToken(
        userDetails?._id,
        "email_verification",
      );
      let Mail = await VerifyMail(userDetails, token);
      this.mailService.AuthMail(Mail);
      return new DataResponseDto({}, true, "Verification Email is sent");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  async verifyEmailToken(user: VerifyUserTokenDto) {
    try {
      const verified = this.verifyScopedToken(
        user?.token,
        "email_verification",
      );
      if (verified) {
        const [status] = await User.update(
          { mail_verify: true },
          { where: { _id: verified.data?.userId } },
        );
        if (status == 0) throw new NotFoundException();
        return new DataResponseDto({}, true, "Email verified successfully");
      }
      throw new UnauthorizedException();
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  async changePassword(
    userId: number,
    payload: UnifiedChangePasswordDto,
    request?: any,
  ): Promise<DataResponseDto> {
    try {
      await this.assertRateLimit(
        `password-change:${userId}`,
        CHANGE_PASSWORD_LIMIT,
        CHANGE_PASSWORD_WINDOW_MS,
      );

      const user = await User.findByPk(userId);
      this.assertUserCanAuthenticate(user);

      await this.writePasswordActivityLog({
        actorId: user._id,
        actorRole: this.resolvePrimaryRole(user),
        targetUserId: user._id,
        action: "password_change_requested",
        request,
      });

      if (!user.password) {
        throw new UnauthorizedException(
          "No existing password found. Please use add password or forgot password.",
        );
      }

      this.assertPasswordConfirmed(payload.newPassword, payload.confirmPassword);

      const isMatch = await compare(payload.oldPassword, user.password);
      if (!isMatch) throw new UnauthorizedException("Invalid Password..");

      await this.assertPasswordNotReused(user, payload.newPassword);

      user.password = await this.hashPassword(payload.newPassword);
      user.password_changed_at = new Date();
      user.password_reset_token_hash = null;
      user.password_reset_expires_at = null;
      await user.save();

      await this.tokenService.signoutFromAll(user._id);
      await this.sendPasswordChangedMail(user);

      await this.writePasswordActivityLog({
        actorId: user._id,
        actorRole: this.resolvePrimaryRole(user),
        targetUserId: user._id,
        action: "password_changed",
        request,
      });

      return new DataResponseDto({}, true, "Password changed successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async forgotPassword(
    payload: ForgotPasswordDto,
    request?: any,
  ): Promise<DataResponseDto> {
    return this.forgotPasswordUnified(payload, request);
  }

  async forgotPasswordUnified(
    { email }: UnifiedForgotPasswordDto,
    request?: any,
  ): Promise<DataResponseDto> {
    const normalizedEmail = this.normalizeEmail(email);
    const meta = this.requestMeta(request);
    const emailKey = this.hashRateLimitValue(normalizedEmail);
    const ipKey = this.hashRateLimitValue(meta.ipAddress || "unknown");

    try {
      await this.assertRateLimit(
        `forgot-password:email:${emailKey}`,
        FORGOT_PASSWORD_LIMIT,
        FORGOT_PASSWORD_WINDOW_MS,
      );
      await this.assertRateLimit(
        `forgot-password:ip:${ipKey}`,
        FORGOT_PASSWORD_LIMIT * 3,
        FORGOT_PASSWORD_WINDOW_MS,
      );

      const userDetails = await User.findOne({
        where: {
          email: {
            [Op.iLike]: normalizedEmail,
          },
        },
      });

      await this.writePasswordActivityLog({
        actorId: userDetails?._id || 0,
        actorRole: userDetails ? this.resolvePrimaryRole(userDetails) : "system",
        targetUserId: userDetails?._id || null,
        action: "password_reset_requested",
        metadata: { email_hash: emailKey, account_found: Boolean(userDetails) },
        request,
      });

      const canReset =
        userDetails &&
        !userDetails.is_deleted &&
        (userDetails.is_active ?? userDetails.status) === true &&
        userDetails.status === true;

      if (canReset) {
        await this.sendPasswordResetLink(userDetails);
      }

      return new DataResponseDto({}, true, PASSWORD_RESET_SUCCESS_MESSAGE);
    } catch (err) {
      if (
        err instanceof HttpException &&
        err.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        throw err;
      }

      if (err instanceof HttpException) {
        return new DataResponseDto({}, true, PASSWORD_RESET_SUCCESS_MESSAGE);
      }

      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async adminForgotPassword({
    email,
  }: AdminForgotPasswordDto): Promise<DataResponseDto> {
    return this.forgotPasswordUnified({ email });
  }

  async requestAdminPasswordChange(userId: number): Promise<DataResponseDto> {
    try {
      const userDetails = await User.findByPk(userId);
      this.assertUserCanAuthenticate(userDetails);

      if (!this.userHasAdminRole(userDetails)) {
        throw new UnauthorizedException("Only admins can request this reset link");
      }

      await this.sendPasswordResetLink(userDetails);

      return new DataResponseDto(
        {},
        true,
        "Password reset link has been sent to your email.",
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async resetPassword(
    password: ChangePasswordDto,
    request?: any,
  ): Promise<DataResponseDto> {
    return this.resetPasswordUnified(
      {
        email: undefined,
        token: password.token,
        newPassword: password.password,
        confirmPassword: password.password,
      } as any,
      request,
    );
  }

  async adminResetPassword({
    token,
    newPassword,
  }: AdminResetPasswordDto): Promise<DataResponseDto> {
    return this.resetPasswordUnified({
      email: undefined,
      token,
      newPassword,
      confirmPassword: newPassword,
    } as any);
  }

  async resetPasswordUnified(
    { email, token, newPassword, confirmPassword }: UnifiedResetPasswordDto,
    request?: any,
  ): Promise<DataResponseDto> {
    const normalizedEmail = this.normalizeEmail(email);
    const tokenHash = this.hashPasswordResetToken(token);
    const tokenKey = this.hashRateLimitValue(tokenHash);
    const emailKey = normalizedEmail
      ? this.hashRateLimitValue(normalizedEmail)
      : null;

    try {
      await this.assertRateLimit(
        `reset-password:token:${tokenKey}`,
        RESET_PASSWORD_LIMIT,
        RESET_PASSWORD_WINDOW_MS,
      );

      const user = await User.findOne({
        where: {
          password_reset_token_hash: tokenHash,
          ...(normalizedEmail
            ? {
                email: {
                  [Op.iLike]: normalizedEmail,
                },
              }
            : {}),
        },
      });

      if (!user) {
        await this.writePasswordActivityLog({
          actorId: 0,
          actorRole: "system",
          targetUserId: null,
          action: "password_reset_failed",
          metadata: {
            reason: "token_not_found_or_email_mismatch",
            ...(emailKey ? { email_hash: emailKey } : {}),
          },
          request,
        });
        throw new UnauthorizedException("Invalid or expired password reset token");
      }

      if (
        user.is_deleted ||
        (user.is_active ?? user.status) !== true ||
        user.status !== true
      ) {
        await this.writePasswordActivityLog({
          actorId: user._id,
          actorRole: this.resolvePrimaryRole(user),
          targetUserId: user._id,
          action: "password_reset_failed",
          metadata: { reason: "account_inactive" },
          request,
        });
        throw new UnauthorizedException("Invalid or expired password reset token");
      }

      if (
        !user.password_reset_expires_at ||
        user.password_reset_expires_at.getTime() <= Date.now()
      ) {
        await this.writePasswordActivityLog({
          actorId: user._id,
          actorRole: this.resolvePrimaryRole(user),
          targetUserId: user._id,
          action: "password_reset_failed",
          metadata: { reason: "token_expired" },
          request,
        });
        throw new UnauthorizedException("Invalid or expired password reset token");
      }

      if (newPassword !== confirmPassword) {
        await this.writePasswordActivityLog({
          actorId: user._id,
          actorRole: this.resolvePrimaryRole(user),
          targetUserId: user._id,
          action: "password_reset_failed",
          metadata: { reason: "password_confirmation_mismatch" },
          request,
        });
        throw new ConflictException("Password confirmation does not match");
      }

      const isReused = user.password
        ? await compare(newPassword, user.password)
        : false;
      if (isReused) {
        await this.writePasswordActivityLog({
          actorId: user._id,
          actorRole: this.resolvePrimaryRole(user),
          targetUserId: user._id,
          action: "password_reset_failed",
          metadata: { reason: "password_reuse" },
          request,
        });
        throw new ConflictException("Please choose a password you have not used before");
      }

      user.password = await this.hashPassword(newPassword);
      user.password_reset_token_hash = null;
      user.password_reset_expires_at = null;
      user.password_changed_at = new Date();
      await user.save();

      await this.tokenService.signoutFromAll(user._id);
      await this.sendPasswordChangedMail(user);

      await this.writePasswordActivityLog({
        actorId: user._id,
        actorRole: this.resolvePrimaryRole(user),
        targetUserId: user._id,
        action: "password_reset_success",
        request,
      });
      await this.writePasswordActivityLog({
        actorId: user._id,
        actorRole: this.resolvePrimaryRole(user),
        targetUserId: user._id,
        action: "password_changed",
        request,
      });

      return new DataResponseDto(
        {},
        true,
        "Password reset successful",
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  private async sendPasswordResetLink(userDetails: User): Promise<void> {
    const token = this.createPasswordResetToken();
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000,
    );

    userDetails.password_reset_token_hash = this.hashPasswordResetToken(token);
    userDetails.password_reset_expires_at = expiresAt;
    await userDetails.save();

    const mail = await AdminForgotPasswordMail(
      userDetails,
      token,
      PASSWORD_RESET_EXPIRY_MINUTES,
    );
    await this.mailService.AuthMail(mail);
  }

  private async sendPasswordChangedMail(userDetails: User): Promise<void> {
    const mail = await PasswordChangedMail(userDetails);
    await this.mailService.AuthMail(mail);
  }

  async sendDeactivateLink(userId: number) {
    try {
      const userDetails = await User.findByPk(userId);
      if (!userDetails) throw new NotFoundException();
      const token = await this.createScopedVerifyToken(
        userDetails?._id,
        "account_deactivation",
      );
      let Mail = await DeactivateAccountViaMail(userDetails, token);
      this.mailService.AuthMail(Mail);
      const message = "Deactivation link has been sent to your Email id";
      return new DataResponseDto({}, true, message);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  //to deactivate account via email
  async deactivateAccount(input: DeactivateAccountDto) {
    try {
      const verified = this.verifyScopedToken(
        input?.token,
        "account_deactivation",
      );
      if (verified) {
        const [count, [user]] = await User.update(
          { status: false, is_active: false, disabled_at: new Date() },
          { where: { _id: verified.data?.userId }, returning: true },
        );
        if (count == 0) throw new NotFoundException();
        let Mail = await DeactivateMail(user, {});
        this.mailService.AuthMail(Mail);
        const message = "Account Deactivated Successfully";
        return new DataResponseDto({}, true, message);
      }
      throw new UnauthorizedException();
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  async checkPhoneNumber(phone: string) {
    try {
      const checkphone = await User.findOne({
        where: {
          phone: phone,
        },
      });
      if (!checkphone) {
        return new DataResponseDto(false, true, "Phone not available");
      }
      return new DataResponseDto(true, true, "Phone available");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async checkEmail(email: string) {
    try {
      if (email?.length > 10) {
        const checkEmail = await User.findOne({
          where: {
            email: email?.toLowerCase(),
          },
        });
        if (!checkEmail) {
          return new DataResponseDto(false, true, "Email not available");
        }
        return new DataResponseDto(true, true, "Email available");
      }
      return new DataResponseDto(false, true, "Invalid Email ID");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async createNewToken(refreshToke: RefreshTokenDto) {
    const { refreshToken: oldToken } = refreshToke;
    try {
      const verified = this.jwtService.verify(oldToken);
      const [refresh, userId] = await this.tokenService.regenerateToken(
        verified?.otp,
        verified?.fid,
      );
      const user = await User.findOne({
        where: { _id: userId },
        attributes: { exclude: ["password", "createdAt", "updatedAt"] },
      });
      this.assertUserCanAuthenticate(user, "User not Found.");
      const token = await this.createToken(user, verified?.fid);
      const message = "Refresh token generated successfully.";
      return new DataResponseDto(user, true, message, token, refresh);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException("Failed Validate.");
    }
  }

  async signoutFromAll(userId: number) {
    try {
      const log = await this.tokenService.signoutFromAll(userId);
      return new DataResponseDto(
        {},
        true,
        `You Are signed out from ${log?.length} Devices.`,
      );
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}
