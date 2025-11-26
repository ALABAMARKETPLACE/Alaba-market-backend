// =====================================================
// FILE: backend/src/modules/users/users.service.ts
// =====================================================
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user-entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Op } from 'sequelize';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Create user (password will be auto-hashed by entity hook)
    const user = await this.userModel.create(createUserDto as any);
    return user;
  }

  async findAll(filters?: {
    role?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<User[]> {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${filters.search}%` } },
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    return this.userModel.findAll({
      where,
      attributes: { exclude: ['password', 'refreshToken'] },
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findByPk(id, {
      attributes: { exclude: ['password', 'refreshToken'] },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ 
      where: { email } 
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async findByRole(role: string): Promise<User[]> {
    return this.userModel.findAll({
      where: { role, isActive: true },
      attributes: { exclude: ['password', 'refreshToken'] },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Don't allow updating sensitive fields through this method
    const { password, refreshToken, ...safeUpdates } = updateUserDto as any;

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.userModel.findOne({
        where: { 
          email: updateUserDto.email,
          id: { [Op.ne]: id } 
        },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    await user.update(safeUpdates);
    return user;
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findByPk(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Password will be auto-hashed by entity hook
    await user.update({ password: newPassword });
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findOne(id);
    await user.update({ isActive: false });
  }

  async activate(id: string): Promise<void> {
    const user = await this.userModel.findByPk(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await user.update({ isActive: true });
  }

  async delete(id: string): Promise<void> {
    const user = await this.findOne(id);
    await user.destroy();
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.userModel.update(
      { refreshToken },
      { where: { id: userId } },
    );
  }

  async verifyEmail(id: string): Promise<void> {
    const user = await this.findOne(id);
    await user.update({ emailVerified: true });
  }

  async getUserStats(id: string): Promise<any> {
    const user = await this.findOne(id);
    
    // Get related statistics based on role
    const stats: any = {
      userId: user.id,
      role: user.role,
      accountCreated: user.createdAt,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
    };

    // Role-specific stats would be added here
    // This is a placeholder for future enhancements

    return stats;
  }
}