// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/entities/user-entity';
import { Driver } from '../drivers/entities/driver.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Driver)
    private driverModel: typeof Driver,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.userModel.create(registerDto as any);

    // If user is registering as a driver, create Driver record
    if (registerDto.role === 'driver') {
      await this.driverModel.create({
        userId: user.id,
        name: `${registerDto.firstName} ${registerDto.lastName}`,
        phone: registerDto.phone || '',
        email: registerDto.email,
        licenseNumber: registerDto.licenseNumber || null,
        vehicleNumber: registerDto.vehicleNumber || null,
        isActive: true,
        isAvailable: true,
        companyId: null, // No company assigned yet
      });
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({
      where: { email: loginDto.email },
    });

    if (!user || !(await user.validatePassword(loginDto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Body-based refresh flow used by the frontend.
   * Accepts a raw refresh token, verifies it with the refresh secret,
   * then delegates to the existing refreshTokens(userId, refreshToken).
   */
  async refreshTokensFromRaw(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      if (!payload?.sub) {
        throw new UnauthorizedException('Access denied');
      }

      return this.refreshTokens(payload.sub, refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Access denied');
    }
  }

  async logout(userId: string) {
    await this.userModel.update({ refreshToken: null }, { where: { id: userId } });
    return { message: 'Logged out successfully' };
  }

  async updateProfile(userId: string, updateData: Partial<User>) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Remove sensitive fields
    delete updateData['password'];
    delete updateData['refreshToken'];
    delete updateData['email'];
    delete updateData['role'];

    await user.update(updateData);
    return user.toJSON();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await user.validatePassword(currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userModel.update({ refreshToken: hashedRefreshToken }, { where: { id: userId } });
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate a password reset token (valid for 1 hour)
    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'password-reset' },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h',
      },
    );

    // TODO: Send email with reset link
    // For now, log the token (in production, send via email service)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);

    return { message: 'Password reset instructions sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.type !== 'password-reset') {
        throw new UnauthorizedException('Invalid token');
      }

      const user = await this.userModel.findByPk(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      user.password = newPassword;
      await user.save();

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async socialLogin(
    provider: string,
    token: string,
  ): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }> {
    // TODO: Verify token with Google/Facebook APIs
    // For now, this is a placeholder that returns an error

    // In production, you would:
    // 1. Verify the token with the OAuth provider
    // 2. Get user info from the provider
    // 3. Find or create user in database
    // 4. Generate JWT tokens

    throw new UnauthorizedException(
      `${provider} OAuth is not configured. Please set up OAuth credentials in the backend.`,
    );

    // Example implementation when OAuth is configured:
    /*
    let userInfo;
    
    if (provider === 'google') {
      // Verify Google token and get user info
      userInfo = await this.verifyGoogleToken(token);
    } else if (provider === 'facebook') {
      // Verify Facebook token and get user info
      userInfo = await this.verifyFacebookToken(token);
    } else {
      throw new UnauthorizedException('Invalid provider');
    }

    // Find or create user
    let user = await this.userModel.findOne({
      where: { email: userInfo.email },
    });

    if (!user) {
      user = await this.userModel.create({
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        role: 'buyer',
        password: Math.random().toString(36), // Random password for OAuth users
        emailVerified: true,
      });
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: user.toJSON(),
      ...tokens,
    };
    */
  }
}
