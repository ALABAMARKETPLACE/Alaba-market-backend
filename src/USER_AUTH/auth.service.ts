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

@Injectable()
export class AuthService {
  constructor(
    private mailService: MailService,
    @Inject("CreateToken")
    private createToken: (user: User, fid: number) => Promise<string | null>,
    @Inject("CreateVerifyToken")
    private createVerifyToken: (userId: number) => Promise<string | null>,
    @Inject("hashPassword")
    private hashPassword: (password: string) => Promise<string>,
    private readonly tokenService: TokenManagementService,
    private readonly authRepo: AuthRepository,
    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtService
  ) {}

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

      const exist = await this.authRepo.checkUserExist(body?.email, phone);
      if (exist) throw new ConflictException("User Already Exist.");
      const user = await this.authRepo.createNewUser(body, phone);
      if (!user)
        throw new InternalServerErrorException("Failed to Create Account..");
      const [refresh, fid] = await this.tokenService.createToken(user._id);
      const token = await this.createToken(user, fid);
      let Mail = await SignupHtml(user, token);
      this.mailService.AuthMail(Mail);
      const message = "Account created successfully.";
      return new DataResponseDto(user, true, message, token, refresh, true);
    } catch (err) {
      let message = `signup Faild. Please try again, ${getErrorMessage(err)}`;
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(message);
    }
  }

  async emailLogin(body: login_Request) {
    try {
      console.log('=== AUTH SERVICE EMAIL LOGIN ===');
      console.log('Login body received:', JSON.stringify(body, null, 2));
      
      const { email, password, fcmtoken, seller_fcmtoken } = body;
      console.log('Extracted email:', email);
      console.log('Password provided:', password ? 'YES' : 'NO');
      
      const user = await this.authRepo.findUserbyEmail(email);
      console.log('User found:', user ? 'YES' : 'NO');
      if (user) {
        console.log('User ID:', user._id);
        console.log('User status:', user.status);
        console.log('Has password:', user?.password ? 'YES' : 'NO');
      }
      
      if (!user) throw new NotFoundException(`No User found for ${email}`);
      if (user?.status != true)
        throw new UnauthorizedException("Your Account is Deactivated");
      if (!user?.password)
        throw new UnauthorizedException("No Password Found. use Google Login.");
        
      console.log('Comparing passwords...');
      const isMatch = await compare(password, user?.password ?? "");
      console.log('Password match:', isMatch);
      
      if (!isMatch) throw new UnauthorizedException("Incorrect Password..");
      
      console.log('Password verified, creating tokens...');
      await this.authRepo.saveFcm(fcmtoken, user?._id);
      if (seller_fcmtoken)
        await this.authRepo.saveSellerFcm(seller_fcmtoken, user.store_id);
      const [refresh, fid] = await this.tokenService.createToken(user._id);
      const token = await this.createToken(user, fid);
      let message = "Login Successfull";
      console.log('Login successful, returning response');
      return new DataResponseDto(user, true, message, token, refresh);
    } catch (err) {
      console.log('=== LOGIN ERROR ===');
      console.log('Error type:', err.constructor.name);
      console.log('Error message:', err.message);
      console.log('Error stack:', err.stack);
      
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
          body?.fcmtoken
        );
        const [refresh, fid] = await this.tokenService.createToken(
          newuser?._id
        );
        const token = await this.createToken(newuser, fid);
        let message = "Login Successfull";
        return new DataResponseDto(newuser, true, message, token, refresh);
      } else {
        if (user?.status != true)
          throw new UnauthorizedException("Account is Deactivated");
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
        if (user?.status != true)
          throw new UnauthorizedException("Your Account is Deactivated");
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
        if (user?.status != true)
          throw new UnauthorizedException("Your Account is Deactivated");
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
      return new DataResponseDto(user, true, message, token, refresh, true);
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
      const token = await this.createVerifyToken(userDetails?._id);
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
      const verified = this.jwtService.verify(user?.token);
      if (verified) {
        const [status] = await User.update(
          { mail_verify: true },
          { where: { _id: verified.data?.userId } }
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

  async forgotPassword({ email }: ForgotPasswordDto) {
    try {
      const userDetails: any = await User.findOne({
        where: { email },
      });
      if (!userDetails) throw new NotFoundException();
      const token = await this.createVerifyToken(userDetails?._id);
      let Mail = await RequestPasswdChangeTemplate(userDetails, token);
      this.mailService.AuthMail(Mail);
      const message = "Password Resest Email has been sent";
      return new DataResponseDto({}, true, message);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(getErrorMessage(err));
    }
  }

  async resetPassword(password: ChangePasswordDto) {
    try {
      const verified = this.jwtService.verify(password?.token);
      if (verified) {
        let newPassword = await this.hashPassword(password?.password);
        const [status, [user]] = await User.update(
          { password: newPassword },
          { where: { _id: verified.data?.userId }, returning: true }
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
      const token = await this.createVerifyToken(userDetails?._id);
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
      const verified = this.jwtService.verify(input?.token);
      if (verified) {
        const [count, [user]] = await User.update(
          { status: false },
          { where: { _id: verified.data?.userId }, returning: true }
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
        verified?.fid
      );
      const user = await User.findOne({
        where: { _id: userId },
        attributes: { exclude: ["password", "createdAt", "updatedAt"] },
      });
      if (!user) throw new NotFoundException("User not Found.");
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
        `You Are signed out from ${log?.length} Devices.`
      );
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}
