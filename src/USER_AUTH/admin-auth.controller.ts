import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthService } from "./auth.service";
import { AdminForgotPasswordDto } from "./dto/admin-forgot-password.dto";
import { AdminResetPasswordDto } from "./dto/admin-reset-password.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Public } from "../shared/decorator/optional.decorator";
import { RemovePasswordInterceptor } from "../shared/interceptor/remove-password.interceptor";

@Controller("admin/auth")
@ApiTags("admin/auth")
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("forgot-password")
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOkResponse({ type: DataResponseDto })
  forgotPassword(
    @Body() payload: AdminForgotPasswordDto,
  ): Promise<DataResponseDto> {
    return this.authService.adminForgotPassword(payload);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiOkResponse({ type: DataResponseDto })
  resetPassword(
    @Body() payload: AdminResetPasswordDto,
  ): Promise<DataResponseDto> {
    return this.authService.adminResetPassword(payload);
  }
}
