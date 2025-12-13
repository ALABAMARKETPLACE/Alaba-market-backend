// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    };
  }

  @Post('google')
  @ApiOperation({ summary: 'Google Sign-In' })
  async googleLogin(
    @Body() googleDto: { idToken: string; email: string; name?: string; photo?: string },
  ) {
    // For now, create/login user with Google email
    // In production, verify idToken with Google API
    const result = await this.authService.googleLogin(googleDto);
    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Refresh access token using Authorization header (Bearer refresh token)',
  })
  async refreshTokens(@Req() req: any) {
    const tokens = await this.authService.refreshTokens(req.user.sub, req.user.refreshToken);
    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token using refresh token in request body' })
  async refreshTokensFromBody(@Body() body: { refreshToken: string }) {
    const tokens = await this.authService.refreshTokensFromRaw(body.refreshToken);
    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.id);
    return {
      success: true,
      data: null,
      message: 'Logged out successfully',
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user' })
  getMe(@Req() req: any) {
    return {
      success: true,
      data: req.user,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('update-profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@Req() req: any, @Body() updateData: any) {
    const user = await this.authService.updateProfile(req.user.id, updateData);
    return {
      success: true,
      data: user,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @Req() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const result = await this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
    return {
      success: true,
      message: result.message,
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() body: { email: string }) {
    await this.authService.forgotPassword(body.email);
    return {
      success: true,
      message: 'Password reset instructions have been sent to your email',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    await this.authService.resetPassword(body.token, body.newPassword);
    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }

  @Post('social-login')
  @ApiOperation({ summary: 'Login with social provider (Google/Facebook)' })
  async socialLogin(@Body() body: { provider: string; token: string }) {
    const result = await this.authService.socialLogin(body.provider, body.token);
    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    };
  }
}
