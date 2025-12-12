// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../users/entities/user-entity';
import { Driver } from '../../drivers/entities/driver.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Driver)
    private driverModel: typeof Driver,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    // The sub is the user.id from the token, keep it as string
    // But we need to find the user by ID in the database
    const user = await this.userModel.findByPk(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // If user is a driver, fetch their driver ID
    if (user.role === 'driver') {
      const driver = await this.driverModel.findOne({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']],
      });
      if (driver) {
        (user as any).driverId = driver.id;
      }
    }

    return user;
  }
}
