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
import * as crypto from "crypto";
import axios from "axios";
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
import { AuthChangePasswordDto } from "./dto/auth-change-password.dto";
import { DeactivateAccountDto } from "./dto/deactivateAccount.dto";
const SignupHtml = require("../MAILS/templates/auth/SignupHtml");
const VerifyMail = require("../MAILS/templates/auth/mailVerfication");
const RequestPasswdChangeTemplate = require("../MAILS/templates/auth/forgotPassword");
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
import {
  normalizeRoles,
  resolveActiveRole,
} from "../shared/helpers/user-role.helper";

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

type SocialLoginUser = {
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

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

  private async alignUserRoleAndType(user: User): Promise<User> {
    const roles = normalizeRoles(user.roles, user.role);
    const activeRole = resolveActiveRole(roles, user.active_role, user.role);
    let changed = false;

    if (JSON.stringify(user.roles || []) !== JSON.stringify(roles)) {
      user.roles = roles;
      changed = true;
    }

    if (user.active_role !== activeRole) {
      user.active_role = activeRole;
      changed = true;
    }

    if (user.role !== activeRole) {
      user.role = activeRole;
      changed = true;
    }

    if (user.type !== activeRole) {
      user.type = activeRole;
      changed = true;
    }

    if (changed) {
      await user.save();
    }

    return user;
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

      await this.alignUserRoleAndType(user);
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
        await this.alignUserRoleAndType(user);
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

  private getGoogleLoginAudiences(): string[] {
    return [
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GGL_CLIENT_ID,
      process.env.FIREBASE_CLIENT_ID,
      "584211747724-eu491egu108e3vobujmif8lkgapi3ah2.apps.googleusercontent.com",
    ].filter(Boolean);
  }

  private async verifyGoogleLoginToken(idToken: string): Promise<SocialLoginUser> {
    const { data } = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
      params: { id_token: idToken },
      timeout: 10000,
    });

    const audiences = this.getGoogleLoginAudiences();
    if (audiences.length && !audiences.includes(data?.aud)) {
      throw new UnauthorizedException("Invalid Google login token");
    }

    if (!data?.email) {
      throw new UnauthorizedException("Invalid Google login token");
    }

    return {
      email: data.email,
      email_verified: data.email_verified === true || data.email_verified === "true",
      name: data.name,
      picture: data.picture,
    };
  }

  private getAppleLoginClientIds(): string[] {
    return [
      process.env.APPLE_CLIENT_ID,
      process.env.APPLE_IOS_CLIENT_ID,
      process.env.IOS_BUNDLE_ID,
      "org.reactjs.native.alabauserapp",
    ].filter(Boolean);
  }

  async googleLogin(body: login_google) {
    try {
      const guser = await this.verifyGoogleLoginToken(body.idToken);
      if (!guser?.email) throw new UnauthorizedException();
      const user = await this.authRepo.findUserbyEmail(guser?.email);
      if (user) {
        this.assertUserCanAuthenticate(user);
        await this.alignUserRoleAndType(user);
        const [refresh, fid] = await this.tokenService.createToken(user._id);
        const token = await this.createToken(user, fid);
        const message = "Login Successful";
        return new DataResponseDto(user, true, message, token, refresh);
      }
      const newuser = await this.authRepo.createUserwithGmail(guser as any);
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
        clientId: this.getAppleLoginClientIds(),
      });
      if (!userDetails.email) throw new UnauthorizedException();
      const user = await this.authRepo.findUserbyEmail(userDetails?.email);
      if (user) {
        this.assertUserCanAuthenticate(user);
        await this.alignUserRoleAndType(user);
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
    payload: AuthChangePasswordDto,
  ): Promise<DataResponseDto> {
    try {
      const user = await User.findByPk(userId);
      this.assertUserCanAuthenticate(user);

      if (!user.password) {
        throw new UnauthorizedException(
          "No existing password found. Please use forgot password.",
        );
      }

      if (payload.newPassword !== payload.confirmPassword) {
        throw new ConflictException("Password confirmation does not match");
      }

      const isOldPasswordValid = await compare(
        payload.oldPassword,
        user.password,
      );
      if (!isOldPasswordValid) {
        throw new UnauthorizedException("Invalid Password..");
      }

      const isReused = await compare(payload.newPassword, user.password);
      if (isReused) {
        throw new ConflictException(
          "Please choose a password you have not used before",
        );
      }

      user.password = await this.hashPassword(payload.newPassword);
      await user.save();

      await this.tokenService.signoutFromAll(user._id);
      await this.sendPasswordChangedMail(user);

      return new DataResponseDto({}, true, "Password changed successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  private async sendPasswordChangedMail(userDetails: User): Promise<void> {
    await this.mailService.AuthMail({
      to: userDetails.email,
      subject: `${process.env.NAME || "Alaba Marketplace"} password changed`,
      template: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 640px; margin: 0 auto; padding: 24px;">
          <h2 style="margin-bottom: 12px;">Your password was changed</h2>
          <p>Hello ${userDetails.first_name || userDetails.name || "there"},</p>
          <p>This is a confirmation that the password for your account was changed successfully.</p>
          <p>If you did not make this change, reset your password immediately and contact support.</p>
        </div>
      `,
    });
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    try {
      const normalizedEmail = this.normalizeEmail(email);
      const userDetails: any = await User.findOne({
        where: {
          email: {
            [Op.iLike]: normalizedEmail,
          },
        },
      });
      this.assertUserCanAuthenticate(userDetails);
      const token = await this.createScopedVerifyToken(
        userDetails?._id,
        "password_reset",
      );
      let Mail = await RequestPasswdChangeTemplate(userDetails, token);
      this.mailService.AuthMail(Mail);
      const message = "Password reset email has been sent";
      return new DataResponseDto({}, true, message);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  async resetPassword(password: ChangePasswordDto) {
    try {
      const verified = this.verifyScopedToken(
        password?.token,
        "password_reset",
      );
      if (verified) {
        const user = await User.findByPk(verified.data?.userId);
        this.assertUserCanAuthenticate(user);

        let newPassword = await this.hashPassword(password?.password);
        const [status] = await User.update(
          { password: newPassword },
          { where: { _id: verified.data?.userId }, returning: true },
        );
        if (status == 0) throw new NotFoundException();
        const message = "Password Updated successfully";
        return new DataResponseDto({}, true, message);
      }
      throw new UnauthorizedException();
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
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
      await this.alignUserRoleAndType(user);
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
