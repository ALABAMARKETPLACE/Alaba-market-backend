import { createStructuredLogger } from "../shared/logger/structured-logger";
import {
  Body,
  Controller,
  HttpCode,
  Post,
  Get,
  Param,
  Patch,
  ValidationPipe,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiTags,
  ApiOkResponse,
  ApiParam,
} from "@nestjs/swagger";

import {
  login_Request,
  login_phone,
  login_google,
  login_apple,
} from "./dto/login.dto";
import { signup_Request } from "./dto/signup.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";

import { AuthService } from "./auth.service";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { VerifyUserTokenDto } from "./dto/verifyToken.dto";
import { ChangePasswordDto } from "./dto/changePassword.dto";
import { ForgotPasswordDto } from "./dto/forgotPassword.dto";
import { DeactivateAccountDto } from "./dto/deactivateAccount.dto";
import { IsEmail, IsNotEmpty, IsString, Validate } from "class-validator";
import { AuthGuard } from "../shared/guards/auth.guard";
import { UserId } from "../shared/decorator/userId_decorator";
import { VerifyMailDto } from "./dto/verifyMail.dto";
import { IsValidPhoneNumberValidator } from "../shared/validator/phone_validator";
import { RemovePasswordInterceptor } from "../shared/interceptor/remove-password.interceptor";
import { RefreshTokenDto } from "./dto/refresh_token.dto";
import { Fid } from "../shared/decorator/fid.decorator";
import { Public } from "../shared/decorator/optional.decorator";
import { TokenManagementService } from "../TOKEN_MANAGEMENT/services";
import { AuthChangePasswordDto } from "./dto/auth-change-password.dto";
import { Throttle } from "@nestjs/throttler";

const appLog = createStructuredLogger("auth_controller");
class CheckEmailParams {
  @IsNotEmpty({ message: "Please Provide an Email ID" })
  @IsEmail({}, { message: "Invalid email format" })
  email: string;
}
class CheckPhoneParams {
  @IsNotEmpty({ message: "Please Provide a Phone Number" })
  @Validate(IsValidPhoneNumberValidator)
  phone: string;
}
@Controller("auth")
@ApiTags("auth")
export class AuthController {
  constructor(
    private readonly AuthService: AuthService,
    private readonly tokenService: TokenManagementService,
  ) {}

  //to signout from app
  @Public()
  @UseGuards(AuthGuard)
  @Get("signout")
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ type: DataResponseDto })
  signout(@Fid() fid: number): Promise<DataResponseDto> {
    return this.tokenService.signOut(fid);
  }

  //to signout from all devices.
  @Public()
  @UseGuards(AuthGuard)
  @Get("signoutall")
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ type: DataResponseDto })
  signoutall(@UserId() userId: number): Promise<DataResponseDto> {
    return this.AuthService.signoutFromAll(userId);
  }

  //to check if a phone number is already used by any user
  @Get("checkphone/:phone")
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "phone", required: true })
  checkPhone(
    @Param(ValidationPipe) phone: CheckPhoneParams,
  ): Promise<DataResponseDto> {
    return this.AuthService.checkPhoneNumber(phone?.phone);
  }

  //to check if an email id is already used by any user
  @Get("checkEmail/:email")
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "email", required: true })
  checkEmail(@Param(ValidationPipe) email: CheckEmailParams): Promise<any> {
    return this.AuthService.checkEmail(email?.email);
  }

  //to create new account using email and phone.. phone should be verified with otp
  @Post("signup")
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiCreatedResponse({ type: DataResponseDto })
  @UseInterceptors(RemovePasswordInterceptor)
  signup(@Body() signup_Request: signup_Request): Promise<DataResponseDto> {
    appLog.info(
      { event: "signup_requested" },
      "user signup requested",
    );
    return this.AuthService.signup(signup_Request);
  }

  //to request email verification for users with email not verified.
  @UseGuards(AuthGuard)
  @Post("email-verify")
  @ApiDataObjectResponse(DataResponseDto)
  @HttpCode(201)
  @ApiBearerAuth()
  create(@UserId() userId: number): Promise<DataResponseDto> {
    return this.AuthService.verifyEmail(userId);
  }

  //to verify the email of the user(from the link sent to their email address contains token)
  @Post("verify-email")
  @ApiDataObjectResponse(VerifyMailDto)
  @HttpCode(201)
  @ApiBearerAuth()
  check(@Body() create: VerifyUserTokenDto): Promise<DataResponseDto> {
    return this.AuthService.verifyEmailToken(create);
  }

  //to refresh the accesstoken/refresh token
  @Post("refresh-token")
  @ApiCreatedResponse({ type: DataResponseDto })
  @ApiBearerAuth()
  @UseInterceptors(RemovePasswordInterceptor)
  refreshToken(@Body() refreshToken: RefreshTokenDto) {
    return this.AuthService.createNewToken(refreshToken);
  }

  //login with email id and password.
  @Post("login")
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiCreatedResponse({ type: DataResponseDto })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(RemovePasswordInterceptor)
  login(@Body() login_Request: login_Request) {
    appLog.info({ event: "login_requested" }, "user login requested");

    const result = this.AuthService.emailLogin(login_Request);

    result
      .then(() => {
        appLog.info({ event: "login_succeeded" }, "user login succeeded");
      })
      .catch((error) => {
        appLog.warn(
          { event: "login_failed", err: error },
          "user login failed",
        );
      });

    return result;
  }

  @UseGuards(AuthGuard)
  @Patch("change-password")
  @HttpCode(200)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOkResponse({ type: DataResponseDto })
  changePassword(
    @UserId() userId: number,
    @Body() payload: AuthChangePasswordDto,
  ): Promise<DataResponseDto> {
    return this.AuthService.changePassword(userId, payload);
  }

  //login via phone using phone verification via otp firebase
  @Post("phone-login")
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiCreatedResponse({ type: DataResponseDto })
  @ApiBearerAuth()
  @UseInterceptors(RemovePasswordInterceptor)
  phoneLogin(@Body() login_phone: login_phone): any {
    return this.AuthService.phoneLogin(login_phone);
  }

  //login with google(gmail login) verification by firebase
  @Post("google-login")
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiCreatedResponse({ type: DataResponseDto })
  @ApiBearerAuth()
  @UseInterceptors(RemovePasswordInterceptor)
  googleLogin(@Body() login_google: login_google): any {
    return this.AuthService.googleLogin(login_google);
  }

  //login with apple(apple login) verification by firebase
  @Post("apple-login")
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiCreatedResponse({ type: DataResponseDto })
  @ApiBearerAuth()
  @UseInterceptors(RemovePasswordInterceptor)
  appleLogin(@Body() login_apple: login_apple): any {
    return this.AuthService.appleLogin(login_apple);
  }

  //reuest for password change link.. takes email address in body
  @Post("forgot-password")
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiCreatedResponse({ type: DataResponseDto })
  @ApiBearerAuth()
  forgot(@Body() forgot: ForgotPasswordDto): Promise<DataResponseDto> {
    appLog.info({ forgot });
    return this.AuthService.forgotPassword(forgot);
  }

  //to reset the password. requires token in body and new password
  @Post("reset-password")
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiCreatedResponse({ type: DataResponseDto })
  @ApiBearerAuth()
  resetPassword(@Body() forgot: ChangePasswordDto): Promise<DataResponseDto> {
    return this.AuthService.resetPassword(forgot);
  }

  //request to deactivate an account via email.(link will be sent to emailid)
  @UseGuards(AuthGuard)
  @Post("request-deactivate")
  @ApiCreatedResponse({ type: DataResponseDto })
  @ApiBearerAuth()
  requestDeactivate(@UserId() userId: number): Promise<DataResponseDto> {
    return this.AuthService.sendDeactivateLink(userId);
  }

  //to deactivate a user's account. via emailI(token)
  @Post("deactivate-account")
  @ApiCreatedResponse({ type: DataResponseDto })
  @ApiBearerAuth()
  deactivateAccount(
    @Body() deact: DeactivateAccountDto,
  ): Promise<DataResponseDto> {
    return this.AuthService.deactivateAccount(deact);
  }
}
