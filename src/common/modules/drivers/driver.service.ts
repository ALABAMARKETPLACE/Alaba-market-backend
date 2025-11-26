// =====================================================
// FILE: backend/src/modules/drivers/drivers.service.ts
// =====================================================
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Driver } from './entities/driver.entity';
import { DriverInvitation } from './entities/driver-invitation.entity';
import { DeliveryCompany } from '..//delivery/entities/delivery-compnay-entity';
import { Order } from '../orders/entities/order-entity';
import { User } from '../users/entities/user-entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { AssignDriverDto, UpdateAvailabilityDto } from '../delivery/dto/assigned-driver.dto';
import { OrderStatus } from '../../enums/order-status';
import { Op } from 'sequelize';

@Injectable()
export class DriversService {
  constructor(
    @InjectModel(Driver)
    private driverModel: typeof Driver,
    @InjectModel(DriverInvitation)
    private invitationModel: typeof DriverInvitation,
    @InjectModel(DeliveryCompany)
    private companyModel: typeof DeliveryCompany,
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async create(dto: CreateDriverDto, companyId: string): Promise<Driver> {
    const company = await this.companyModel.findByPk(companyId);

    if (!company) {
      throw new NotFoundException('Delivery company not found');
    }

    // Check for duplicate phone within same company
    const existingDriver = await this.driverModel.findOne({
      where: {
        companyId,
        phone: dto.phone,
      },
    });

    if (existingDriver) {
      throw new BadRequestException('Driver with this phone already exists in your company');
    }

    const driver = await this.driverModel.create({
      ...dto,
      companyId,
      isActive: true,
      isAvailable: true,
    } as any);

    return driver;
  }

  async findAll(companyId: string, filters?: { isAvailable?: boolean }): Promise<Driver[]> {
    const where: any = { companyId };

    if (filters?.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    return this.driverModel.findAll({
      where,
      include: [
        { model: DeliveryCompany, as: 'company' },
        { model: User },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async findById(driverId: string): Promise<Driver> {
    const driver = await this.driverModel.findByPk(driverId, {
      include: [
        { model: DeliveryCompany, as: 'company' },
        { model: User },
      ],
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  async findAvailableDrivers(companyId: string): Promise<Driver[]> {
    return this.driverModel.findAll({
      where: {
        companyId,
        isActive: true,
        isAvailable: true,
      },
      order: [['createdAt', 'ASC']],
    });
  }

  async update(driverId: string, companyId: string, dto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.driverModel.findByPk(driverId);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.companyId !== companyId) {
      throw new ForbiddenException('Not authorized to update this driver');
    }

    // Check for duplicate phone if phone is being updated
    if (dto.phone && dto.phone !== driver.phone) {
      const existingDriver = await this.driverModel.findOne({
        where: {
          companyId,
          phone: dto.phone,
          id: { [Op.ne]: driverId },
        },
      });

      if (existingDriver) {
        throw new BadRequestException('Driver with this phone already exists in your company');
      }
    }

    await driver.update(dto);
    return driver;
  }

  async delete(driverId: string, companyId: string): Promise<void> {
    const driver = await this.driverModel.findByPk(driverId);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.companyId !== companyId) {
      throw new ForbiddenException('Not authorized to delete this driver');
    }

    // Check if driver has active deliveries
    const activeDeliveries = await this.orderModel.count({
      where: {
        driverId,
        status: {
          [Op.in]: [
            OrderStatus.PICKED_UP,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
    });

    if (activeDeliveries > 0) {
      throw new BadRequestException('Cannot delete driver with active deliveries');
    }

    await driver.update({ isActive: false });
  }

  async getAssignedDeliveries(driverId: string): Promise<Order[]> {
    return this.orderModel.findAll({
      where: {
        driverId,
        status: {
          [Op.in]: [
            OrderStatus.PACKAGE_RECEIVED,
            OrderStatus.PICKED_UP,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: DeliveryCompany },
      ],
      order: [['assignedAt', 'DESC']],
    });
  }

  async getDeliveryHistory(driverId: string, limit: number = 50): Promise<Order[]> {
    return this.orderModel.findAll({
      where: {
        driverId,
        status: {
          [Op.in]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
        },
      },
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
      ],
      order: [['deliveredAt', 'DESC']],
      limit,
    });
  }

  async updateAvailability(
    driverId: string,
    dto: UpdateAvailabilityDto,
  ): Promise<Driver> {
    const driver = await this.driverModel.findByPk(driverId);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Can't set available if there are active deliveries
    if (dto.isAvailable === true) {
      const activeDeliveries = await this.orderModel.count({
        where: {
          driverId,
          status: {
            [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
          },
        },
      });

      if (activeDeliveries > 0) {
        throw new BadRequestException(
          'Cannot set available while having active deliveries',
        );
      }
    }

    await driver.update({ isAvailable: dto.isAvailable });
    return driver;
  }

  // COMPANY SIDE: invite-based driver marketplace

  // List all driver users (directory), optionally filtered by search text
  async findDriverDirectory(search?: string) {
    const where: any = { role: 'driver' };
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const users = await this.userModel.findAll({ where, order: [['createdAt', 'DESC']] });

    // For simplicity, just return users; frontend can show invite button per user
    return users;
  }

  async inviteDriver(companyUserId: string, driverUserId: string, message?: string) {
    const company = await this.companyModel.findOne({ where: { userId: companyUserId } });
    if (!company) {
      throw new NotFoundException('Delivery company not found for this user');
    }

    // Prevent duplicate pending invites
    const existing = await this.invitationModel.findOne({
      where: {
        companyId: company.id,
        driverUserId,
        status: 'pending',
      },
    });

    if (existing) {
      return existing;
    }

    const invite = await this.invitationModel.create({
      companyId: company.id,
      driverUserId,
      status: 'pending',
      message: message || null,
    } as any);

    return invite;
  }

  async getInvitationsForDriver(driverUserId: string) {
    return this.invitationModel.findAll({
      where: { driverUserId },
      include: [{ model: DeliveryCompany, as: 'company' }],
      order: [['createdAt', 'DESC']],
    });
  }

  async acceptInvitation(driverUserId: string, invitationId: string): Promise<Driver> {
    const invite = await this.invitationModel.findByPk(invitationId);
    if (!invite || invite.driverUserId !== driverUserId) {
      throw new NotFoundException('Invitation not found');
    }

    if (invite.status === 'accepted') {
      // Already accepted – find existing driver record
      const existingDriver = await this.driverModel.findOne({
        where: { companyId: invite.companyId, userId: driverUserId },
      });
      if (existingDriver) return existingDriver;
    }

    // Mark invite as accepted
    await invite.update({ status: 'accepted' } as any);

    // Create or fetch driver record for this company/user
    let driver = await this.driverModel.findOne({
      where: { companyId: invite.companyId, userId: driverUserId },
    });

    if (!driver) {
      // Pull basic identity from the user so we satisfy NOT NULL constraints
      const user = await this.userModel.findByPk(driverUserId);
      const derivedName =
        (user && `${user.firstName || ''} ${user.lastName || ''}`.trim()) ||
        (user && user.email) ||
        'Driver';

      driver = await this.driverModel.create({
        companyId: invite.companyId,
        userId: driverUserId,
        name: derivedName,
        phone: '', // can be updated later by company/driver
        email: user ? user.email : null,
        isActive: true,
        isAvailable: true,
      } as any);
    }

    return driver;
  }

  async assignToOrder(dto: AssignDriverDto): Promise<Order> {
    const [order, driver] = await Promise.all([
      this.orderModel.findByPk(dto.orderId),
      this.driverModel.findByPk(dto.driverId),
    ]);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (order.deliveryCompanyId !== driver.companyId) {
      throw new ForbiddenException('Driver does not belong to assigned company');
    }

    if (!driver.isActive || !driver.isAvailable) {
      throw new BadRequestException('Driver is not available for assignment');
    }

    await order.update({
      driverId: driver.id,
      status: OrderStatus.PICKED_UP,
      assignedAt: new Date(),
      trackingHistory: [
        ...order.trackingHistory,
        {
          status: OrderStatus.PICKED_UP,
          timestamp: new Date(),
          remarks: `Assigned to driver: ${driver.name}`,
        },
      ],
    });

    // Set driver as unavailable
    await driver.update({ isAvailable: false });

    return order;
  }

  async getDriverStats(driverId: string): Promise<any> {
    const [
      totalDeliveries,
      completedDeliveries,
      failedDeliveries,
      pendingDeliveries,
      driver,
    ] = await Promise.all([
      this.orderModel.count({ where: { driverId } }),
      this.orderModel.count({
        where: { driverId, status: OrderStatus.DELIVERED },
      }),
      this.orderModel.count({
        where: { driverId, status: OrderStatus.FAILED },
      }),
      this.orderModel.count({
        where: {
          driverId,
          status: {
            [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
          },
        },
      }),
      this.driverModel.findByPk(driverId),
    ]);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const successRate =
      totalDeliveries > 0
        ? ((completedDeliveries / totalDeliveries) * 100).toFixed(2)
        : 0;

    return {
      driverId: driver.id,
      driverName: driver.name,
      isAvailable: driver.isAvailable,
      totalDeliveries,
      completedDeliveries,
      failedDeliveries,
      pendingDeliveries,
      successRate: `${successRate}%`,
    };
  }
}