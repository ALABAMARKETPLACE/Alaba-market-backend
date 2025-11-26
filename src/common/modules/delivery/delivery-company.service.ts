// src/modules/delivery-company/delivery-company.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DeliveryCompany } from '../delivery/entities/delivery-compnay-entity';
import { User } from '../../modules/users/entities/user-entity';
import { Order } from '../../modules/orders/entities/order-entity';
import { Driver } from '../drivers/entities/driver.entity';
import { CreateDeliveryCompanyDto, UpdateDeliveryCompanyDto } from './dto/create-delivery-company.dto';
import { SubscriptionStatus } from '../../enums/subscription-status.enums';
import { OrderStatus } from '../../enums/order-status';
import { Op } from 'sequelize';

@Injectable()
export class DeliveryCompanyService {
  constructor(
    @InjectModel(DeliveryCompany)
    private deliveryCompanyModel: typeof DeliveryCompany,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(Driver)
    private driverModel: typeof Driver,
  ) {}

  async create(userId: string, dto: CreateDeliveryCompanyDto) {
    // Check if user already has a company
    const existing = await this.deliveryCompanyModel.findOne({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('User already has a delivery company');
    }

    // Set 2 months free trial
    const freeTrialEnd = new Date();
    freeTrialEnd.setMonth(freeTrialEnd.getMonth() + 2);

    const company = await this.deliveryCompanyModel.create({
      userId,
      ...dto,
      subscriptionStatus: SubscriptionStatus.FREE_TRIAL,
      freeTrialEndsAt: freeTrialEnd,
      isActive: true,
    } as any);

    return company;
  }

  async findByUserId(userId: string) {
    const company = await this.deliveryCompanyModel.findOne({
      where: { userId },
      include: [
        { model: User },
        { model: Driver },
      ],
    });

    if (!company) {
      throw new NotFoundException('Delivery company not found');
    }

    return company;
  }

  async findById(companyId: string) {
    const company = await this.deliveryCompanyModel.findByPk(companyId, {
      include: [
        { model: User },
        { model: Driver },
      ],
    });

    if (!company) {
      throw new NotFoundException('Delivery company not found');
    }

    return company;
  }

  async update(companyId: string, userId: string, dto: UpdateDeliveryCompanyDto) {
    const company = await this.deliveryCompanyModel.findByPk(companyId);

    if (!company) {
      throw new NotFoundException('Delivery company not found');
    }

    if (company.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this company');
    }

    await company.update(dto);
    return company;
  }

  async checkSubscriptionStatus(companyId: string) {
    const company = await this.deliveryCompanyModel.findByPk(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const now = new Date();

    // Check free trial
    if (company.freeTrialEndsAt && now > company.freeTrialEndsAt) {
      // Free trial ended, check subscription
      if (!company.subscriptionExpiresAt || now > company.subscriptionExpiresAt) {
        await company.update({ subscriptionStatus: SubscriptionStatus.EXPIRED });
        return {
          blocked: true,
          reason: 'Subscription expired',
          message: 'Your subscription has expired. Please renew to continue.',
        };
      }
    }

    return {
      blocked: false,
      subscriptionStatus: company.subscriptionStatus,
      expiresAt: company.subscriptionExpiresAt || company.freeTrialEndsAt,
    };
  }

  async getOrders(companyId: string, status?: string) {
    const where: any = { deliveryCompanyId: companyId };
    
    if (status) {
      where.status = status;
    }

    return this.orderModel.findAll({
      where,
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  // List all unassigned orders so any delivery company can pick from the marketplace.
  async getUnassignedOrders(status?: string, city?: string, state?: string) {
    const where: any = { deliveryCompanyId: null };

    if (status) {
      where.status = status;
    }
    if (city) {
      where.deliveryCity = city;
    }
    if (state) {
      where.deliveryState = state;
    }

    return this.orderModel.findAll({
      where,
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  // Accept an unassigned order and bind it to the calling company.
  async acceptOrder(userId: string, orderId: string) {
    // Find existing company profile for this user, or auto-create one in dev if missing
    let company = await this.deliveryCompanyModel.findOne({ where: { userId } });

    if (!company) {
      // Auto-create a minimal delivery company profile for this user
      const user = await this.userModel.findByPk(userId);
      if (!user) {
        throw new NotFoundException('User not found for this delivery company');
      }

      const freeTrialEnd = new Date();
      freeTrialEnd.setMonth(freeTrialEnd.getMonth() + 2);

      company = await this.deliveryCompanyModel.create({
        userId,
        companyName: user.firstName || user.email || 'Delivery Company',
        description: 'Auto-created delivery company profile',
        routes: [],
        logo: null,
        documents: [],
        registrationNumber: null,
        subscriptionStatus: SubscriptionStatus.FREE_TRIAL,
        freeTrialEndsAt: freeTrialEnd,
        isActive: true,
      } as any);
    }

    const order = await this.orderModel.findByPk(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.deliveryCompanyId && order.deliveryCompanyId !== company.id) {
      throw new ForbiddenException('Order is already assigned to another company');
    }

    await order.update({
      deliveryCompanyId: company.id,
      // Move order into an "assigned" state so company/driver flows can proceed
      status: OrderStatus.ASSIGNED,
    } as any);

    return order;
  }

  async getDrivers(companyId: string) {
    return this.driverModel.findAll({
      where: { companyId },
      include: [{ model: User }],
    });
  }

  async getDashboardStats(companyId: string) {
    const [totalOrders, pendingOrders, completedOrders, totalDrivers] = await Promise.all([
      this.orderModel.count({ where: { deliveryCompanyId: companyId } }),
      this.orderModel.count({
        where: {
          deliveryCompanyId: companyId,
          status: { [Op.in]: ['pending', 'assigned', 'package_received'] },
        },
      }),
      this.orderModel.count({
        where: {
          deliveryCompanyId: companyId,
          status: 'delivered',
        },
      }),
      this.driverModel.count({ where: { companyId } }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalDrivers,
    };
  }

  async findByRoute(city: string, state: string) {
    return this.deliveryCompanyModel.findAll({
      where: {
        isActive: true,
        subscriptionStatus: {
          [Op.in]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.FREE_TRIAL],
        },
      },
      include: [{ model: User }],
    });
    // TODO: Add JSONB query to filter by routes array matching city/state
  }
}