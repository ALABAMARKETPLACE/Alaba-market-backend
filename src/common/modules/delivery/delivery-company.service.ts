// // src/modules/delivery-company/delivery-company.service.ts
// import {
//   Injectable,
//   NotFoundException,
//   ConflictException,
//   ForbiddenException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/sequelize';
// import { MailerService } from '@nestjs-modules/mailer';
// import { DeliveryCompany } from '../delivery/entities/delivery-compnay-entity';
// import { User } from '../../modules/users/entities/user-entity';
// import { Order } from '../../modules/orders/entities/order-entity';
// import { Driver } from '../drivers/entities/driver.entity';
// import {
//   CreateDeliveryCompanyDto,
//   UpdateDeliveryCompanyDto,
// } from './dto/create-delivery-company.dto';
// import { SubscriptionStatus } from '../../enums/subscription-status.enums';
// import { OrderStatus } from '../../enums/order-status';
// import { Op } from 'sequelize';

// @Injectable()
// export class DeliveryCompanyService {
//   constructor(
//     @InjectModel(DeliveryCompany)
//     private deliveryCompanyModel: typeof DeliveryCompany,
//     @InjectModel(User)
//     private userModel: typeof User,
//     @InjectModel(Order)
//     private orderModel: typeof Order,
//     @InjectModel(Driver)
//     private driverModel: typeof Driver,
//     private mailerService: MailerService,
//   ) {}

//   async create(userId: string, dto: CreateDeliveryCompanyDto) {
//     // Check if user already has a company
//     const existing = await this.deliveryCompanyModel.findOne({
//       where: { userId },
//     });

//     if (existing) {
//       throw new ConflictException('User already has a delivery company');
//     }

//     // Set 2 months free trial
//     const freeTrialEnd = new Date();
//     freeTrialEnd.setMonth(freeTrialEnd.getMonth() + 2);

//     const company = await this.deliveryCompanyModel.create({
//       userId,
//       ...dto,
//       subscriptionStatus: SubscriptionStatus.FREE_TRIAL,
//       freeTrialEndsAt: freeTrialEnd,
//       isActive: true,
//     } as any);

//     return company;
//   }

//   async findByUserId(userId: string, autoCreate = true) {
//     let company = await this.deliveryCompanyModel.findOne({
//       where: { userId },
//       include: [{ model: User }, { model: Driver }],
//     });

//     if (!company) {
//       if (autoCreate) {
//         // Auto-create a minimal delivery company profile for this user
//         const user = await this.userModel.findByPk(userId);
//         if (!user) {
//           throw new NotFoundException('User not found for this delivery company');
//         }

//         const freeTrialEnd = new Date();
//         freeTrialEnd.setMonth(freeTrialEnd.getMonth() + 2);

//         company = await this.deliveryCompanyModel.create({
//           userId,
//           companyName: user.firstName || user.email || 'Delivery Company',
//           description: 'Auto-created delivery company profile',
//           routes: [],
//           logo: null,
//           documents: [],
//           registrationNumber: null,
//           subscriptionStatus: SubscriptionStatus.FREE_TRIAL,
//           freeTrialEndsAt: freeTrialEnd,
//           isActive: true,
//         } as any);

//         // Reload with includes
//         company = await this.deliveryCompanyModel.findByPk(company.id, {
//           include: [{ model: User }, { model: Driver }],
//         });
//       } else {
//         throw new NotFoundException('Delivery company not found');
//       }
//     }

//     return company;
//   }

//   async findById(companyId: string) {
//     const company = await this.deliveryCompanyModel.findByPk(companyId, {
//       include: [{ model: User }, { model: Driver }],
//     });

//     if (!company) {
//       throw new NotFoundException('Delivery company not found');
//     }

//     return company;
//   }

//   async update(companyId: string, userId: string, dto: UpdateDeliveryCompanyDto) {
//     const company = await this.deliveryCompanyModel.findByPk(companyId);

//     if (!company) {
//       throw new NotFoundException('Delivery company not found');
//     }

//     if (company.userId !== userId) {
//       throw new ForbiddenException('Not authorized to update this company');
//     }

//     await company.update(dto);
//     return company;
//   }

//   async checkSubscriptionStatus(companyId: string) {
//     const company = await this.deliveryCompanyModel.findByPk(companyId);

//     if (!company) {
//       throw new NotFoundException('Company not found');
//     }

//     const now = new Date();

//     // Check free trial
//     if (company.freeTrialEndsAt && now > company.freeTrialEndsAt) {
//       // Free trial ended, check subscription
//       if (!company.subscriptionExpiresAt || now > company.subscriptionExpiresAt) {
//         await company.update({ subscriptionStatus: SubscriptionStatus.EXPIRED });
//         return {
//           blocked: true,
//           reason: 'Subscription expired',
//           message: 'Your subscription has expired. Please renew to continue.',
//         };
//       }
//     }

//     return {
//       blocked: false,
//       subscriptionStatus: company.subscriptionStatus,
//       expiresAt: company.subscriptionExpiresAt || company.freeTrialEndsAt,
//     };
//   }

//   async getOrders(companyId: string, status?: string) {
//     const where: any = { deliveryCompanyId: companyId };

//     if (status) {
//       where.status = status;
//     }

//     try {
//       const orders = await this.orderModel.findAll({
//         where,
//         order: [['createdAt', 'DESC']],
//       });

//       // Manually load relationships if needed
//       return orders;
//     } catch (error) {
//       console.error('Error fetching orders:', error);
//       throw error;
//     }
//   }

//   // List all unassigned orders so any delivery company can pick from the marketplace.
//   async getUnassignedOrders(status?: string, city?: string, state?: string) {
//     const where: any = { deliveryCompanyId: null };

//     if (status) {
//       where.status = status;
//     }
//     if (city) {
//       where.deliveryCity = city;
//     }
//     if (state) {
//       where.deliveryState = state;
//     }

//     return this.orderModel.findAll({
//       where,
//       include: [
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//       ],
//       order: [['createdAt', 'DESC']],
//     });
//   }

//   // Accept an unassigned order and bind it to the calling company.
//   async acceptOrder(userId: string, orderId: string) {
//     // Find existing company profile for this user, or auto-create one in dev if missing
//     let company = await this.deliveryCompanyModel.findOne({ where: { userId } });

//     if (!company) {
//       // Auto-create a minimal delivery company profile for this user
//       const user = await this.userModel.findByPk(userId);
//       if (!user) {
//         throw new NotFoundException('User not found for this delivery company');
//       }

//       const freeTrialEnd = new Date();
//       freeTrialEnd.setMonth(freeTrialEnd.getMonth() + 2);

//       company = await this.deliveryCompanyModel.create({
//         userId,
//         companyName: user.firstName || user.email || 'Delivery Company',
//         description: 'Auto-created delivery company profile',
//         routes: [],
//         logo: null,
//         documents: [],
//         registrationNumber: null,
//         subscriptionStatus: SubscriptionStatus.FREE_TRIAL,
//         freeTrialEndsAt: freeTrialEnd,
//         isActive: true,
//       } as any);
//     }

//     const order = await this.orderModel.findByPk(orderId, {
//       include: [
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//       ],
//     });

//     if (!order) {
//       throw new NotFoundException('Order not found');
//     }

//     if (order.deliveryCompanyId && order.deliveryCompanyId !== company.id) {
//       throw new ForbiddenException('Order is already assigned to another company');
//     }

//     await order.update({
//       deliveryCompanyId: company.id,
//       // Move order into an "assigned" state so company/driver flows can proceed
//       status: OrderStatus.ASSIGNED,
//     } as any);

//     // Send email notifications about order in transit
//     const isDev = process.env.NODE_ENV !== 'production';
//     if (!isDev) {
//       try {
//         await this.sendOrderInTransitNotifications(order, company);
//       } catch (error) {
//         console.error('Failed to send order in transit notifications:', error?.message || error);
//       }
//     }

//     return order;
//   }

//   async getDrivers(companyId: string) {
//     const drivers = await this.driverModel.findAll({
//       where: { companyId },
//       include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
//     });

//     // Flatten the response to include user data at driver level
//     return drivers.map((driver) => ({
//       id: driver.id,
//       userId: driver.userId,
//       firstName: driver.user?.firstName || driver.name?.split(' ')[0] || '',
//       lastName: driver.user?.lastName || driver.name?.split(' ')[1] || '',
//       email: driver.user?.email || driver.email || '',
//       phone: driver.user?.phone || driver.phone || '',
//       name: driver.name,
//       vehicleNumber: driver.vehicleNumber,
//       licenseNumber: driver.licenseNumber,
//       isActive: driver.isActive,
//       isAvailable: driver.isAvailable,
//       status: driver.isAvailable ? 'available' : 'busy',
//       companyId: driver.companyId,
//       createdAt: driver.createdAt,
//       updatedAt: driver.updatedAt,
//     }));
//   }

//   async getAllDrivers(page: number = 1, limit: number = 100, excludeCompanyId?: string) {
//     const offset = (page - 1) * limit;

//     // Build where clause to exclude drivers from the requesting company
//     const where: any = {};
//     if (excludeCompanyId) {
//       where[Op.or] = [{ companyId: null }, { companyId: { [Op.ne]: excludeCompanyId } }];
//     }

//     const { count, rows } = await this.driverModel.findAndCountAll({
//       where,
//       offset,
//       limit,
//       include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
//       order: [['createdAt', 'DESC']],
//     });

//     // Flatten the response
//     const items = rows.map((driver) => ({
//       id: driver.id,
//       userId: driver.userId,
//       firstName: driver.user?.firstName || driver.name?.split(' ')[0] || '',
//       lastName: driver.user?.lastName || driver.name?.split(' ')[1] || '',
//       email: driver.user?.email || driver.email || '',
//       phone: driver.user?.phone || driver.phone || '',
//       name: driver.name,
//       vehicleNumber: driver.vehicleNumber,
//       licenseNumber: driver.licenseNumber,
//       isActive: driver.isActive,
//       isAvailable: driver.isAvailable,
//       status: driver.isAvailable ? 'available' : 'busy',
//       companyId: driver.companyId,
//       createdAt: driver.createdAt,
//       updatedAt: driver.updatedAt,
//     }));

//     return {
//       items,
//       total: count,
//       page,
//       limit,
//       totalPages: Math.ceil(count / limit),
//     };
//   }

//   async inviteDriver(companyId: string, driverId: string, message?: string) {
//     const driver = await this.driverModel.findByPk(driverId);
//     if (!driver) {
//       throw new NotFoundException('Driver not found');
//     }

//     // Update driver's company assignment
//     await driver.update({
//       companyId,
//     });

//     return {
//       id: driver.id,
//       driverId: driver.id,
//       companyId,
//       message,
//       status: 'accepted',
//       createdAt: new Date(),
//       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
//     };
//   }

//   async getDashboardStats(companyId: string) {
//     const [totalOrders, pendingOrders, completedOrders, totalDrivers] = await Promise.all([
//       this.orderModel.count({ where: { deliveryCompanyId: companyId } }),
//       this.orderModel.count({
//         where: {
//           deliveryCompanyId: companyId,
//           status: { [Op.in]: ['pending', 'assigned', 'package_received'] },
//         },
//       }),
//       this.orderModel.count({
//         where: {
//           deliveryCompanyId: companyId,
//           status: 'delivered',
//         },
//       }),
//       this.driverModel.count({ where: { companyId } }),
//     ]);

//     return {
//       totalOrders,
//       pendingOrders,
//       completedOrders,
//       totalDrivers,
//     };
//   }

//   async findByRoute(city: string, state: string) {
//     return this.deliveryCompanyModel.findAll({
//       where: {
//         isActive: true,
//         subscriptionStatus: {
//           [Op.in]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.FREE_TRIAL],
//         },
//       },
//       include: [{ model: User }],
//     });
//     // TODO: Add JSONB query to filter by routes array matching city/state
//   }

//   // Helper method: Send email notifications when order is accepted (in transit)
//   private async sendOrderInTransitNotifications(
//     order: Order & { buyer?: User; seller?: User },
//     company: DeliveryCompany,
//   ) {
//     const trackingLink = `${process.env.FRONTEND_URL || 'https://alabamarketplace.com'}/tracking/${order.id}`;

//     // Send to buyer
//     if (order.buyer?.email) {
//       await this.mailerService.sendMail({
//         to: order.buyer.email,
//         subject: 'Your Order is in Transit 📦',
//         template: 'order-in-transit',
//         context: {
//           buyerName: order.buyer.firstName || 'Valued Customer',
//           orderNumber: order.id,
//           companyName: company.companyName || 'Our Delivery Company',
//           trackingLink,
//           deliveryAddress: order.deliveryAddress,
//         },
//       });
//     }

//     // Send to seller
//     if (order.seller?.email) {
//       await this.mailerService.sendMail({
//         to: order.seller.email,
//         subject: 'Order Accepted for Delivery - In Transit 📦',
//         template: 'order-in-transit',
//         context: {
//           sellerName: order.seller.firstName || 'Seller',
//           orderNumber: order.id,
//           companyName: company.companyName || 'Our Delivery Company',
//           trackingLink,
//           deliveryAddress: order.deliveryAddress,
//         },
//       });
//     }
//   }
// }

// src/modules/delivery-company/delivery-company.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MailerService } from '@nestjs-modules/mailer';
import { DeliveryCompany } from '../delivery/entities/delivery-compnay-entity';
import { User } from '../../modules/users/entities/user-entity';
import { Order } from '../../modules/orders/entities/order-entity';
import { Driver } from '../drivers/entities/driver.entity';
import {
  CreateDeliveryCompanyDto,
  UpdateDeliveryCompanyDto,
} from './dto/create-delivery-company.dto';
import { SubscriptionStatus } from '../../enums/subscription-status.enums';
import { OrderStatus } from '../../enums/order-status';
import { NotificationsService } from '../notifications/notifications.service';
import { Op } from 'sequelize';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DeliveryCompanyService {
  private readonly logger = new Logger(DeliveryCompanyService.name);

  constructor(
    @InjectModel(DeliveryCompany)
    private deliveryCompanyModel: typeof DeliveryCompany,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(Driver)
    private driverModel: typeof Driver,
    private mailerService: MailerService,
    private notificationsService: NotificationsService,
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

    // 🔔 PUSH NOTIFICATION: Company created
    try {
      await this.notificationsService.sendPushNotification(
        userId,
        '🎉 Welcome to Our Platform!',
        `Your delivery company "${dto.companyName}" has been created successfully`,
        {
          companyId: company.id,
          companyName: dto.companyName,
          freeTrialEndsAt: freeTrialEnd.toISOString(),
          type: 'company_created',
        },
      );
    } catch (error) {
      this.logger.error('Failed to send company creation notification:', error);
    }

    return company;
  }

  async findByUserId(userId: string, autoCreate = true) {
    let company = await this.deliveryCompanyModel.findOne({
      where: { userId },
      include: [{ model: User }, { model: Driver }],
    });

    if (!company) {
      if (autoCreate) {
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

        // Reload with includes
        company = await this.deliveryCompanyModel.findByPk(company.id, {
          include: [{ model: User }, { model: Driver }],
        });

        // 🔔 PUSH NOTIFICATION: Auto-created company
        try {
          await this.notificationsService.sendPushNotification(
            userId,
            '🏢 Company Profile Created',
            'Your delivery company profile has been automatically created',
            {
              companyId: company.id,
              type: 'company_auto_created',
            },
          );
        } catch (error) {
          this.logger.error('Failed to send auto-creation notification:', error);
        }
      } else {
        throw new NotFoundException('Delivery company not found');
      }
    }

    return company;
  }

  async findById(companyId: string) {
    const company = await this.deliveryCompanyModel.findByPk(companyId, {
      include: [{ model: User }, { model: Driver }],
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

    // 🔔 PUSH NOTIFICATION: Company updated
    try {
      await this.notificationsService.sendPushNotification(
        userId,
        '✅ Company Profile Updated',
        'Your delivery company information has been updated',
        {
          companyId: company.id,
          type: 'company_updated',
        },
      );
    } catch (error) {
      this.logger.error('Failed to send company update notification:', error);
    }

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

        // 🔔 PUSH NOTIFICATION: Subscription expired
        try {
          await this.notificationsService.sendPushNotification(
            company.userId,
            '⚠️ Subscription Expired',
            'Your subscription has expired. Please renew to continue using our services',
            {
              companyId: company.id,
              type: 'subscription_expired',
            },
          );
        } catch (error) {
          this.logger.error('Failed to send subscription expiry notification:', error);
        }

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

  // Cron job to check and notify about expiring subscriptions (runs daily)
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringSubscriptions() {
    this.logger.log('Checking for expiring subscriptions...');

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const companies = await this.deliveryCompanyModel.findAll({
      where: {
        isActive: true,
        subscriptionStatus: {
          [Op.in]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.FREE_TRIAL],
        },
        [Op.or]: [
          {
            subscriptionExpiresAt: {
              [Op.lte]: sevenDaysFromNow,
              [Op.gt]: new Date(),
            },
          },
          {
            freeTrialEndsAt: {
              [Op.lte]: sevenDaysFromNow,
              [Op.gt]: new Date(),
            },
          },
        ],
      },
    });

    for (const company of companies) {
      const expiryDate = company.subscriptionExpiresAt || company.freeTrialEndsAt;
      const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // 🔔 PUSH NOTIFICATION: Subscription expiring soon
      try {
        await this.notificationsService.sendPushNotification(
          company.userId,
          '⚠️ Subscription Expiring Soon',
          `Your ${company.subscriptionStatus === SubscriptionStatus.FREE_TRIAL ? 'free trial' : 'subscription'} expires in ${daysLeft} days`,
          {
            companyId: company.id,
            daysLeft,
            expiryDate: expiryDate.toISOString(),
            type: 'subscription_expiring',
          },
        );

        this.logger.log(
          `Expiry notification sent to company ${company.id} (${daysLeft} days left)`,
        );
      } catch (error) {
        this.logger.error(`Failed to send expiry notification to company ${company.id}:`, error);
      }
    }
  }

  async getOrders(companyId: string, status?: string) {
    const where: any = { deliveryCompanyId: companyId };

    if (status) {
      where.status = status;
    }

    try {
      const orders = await this.orderModel.findAll({
        where,
        include: [
          { model: User, as: 'buyer' },
          { model: User, as: 'seller' },
          {
            model: Driver,
            as: 'driver',
            include: [{ model: User, as: 'user' }],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

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

  async acceptOrder(userId: string, orderId: string) {
    let company = await this.deliveryCompanyModel.findOne({ where: { userId } });

    if (!company) {
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

    const order = await this.orderModel.findByPk(orderId, {
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.deliveryCompanyId && order.deliveryCompanyId !== company.id) {
      throw new ForbiddenException('Order is already assigned to another company');
    }

    await order.update({
      deliveryCompanyId: company.id,
      status: OrderStatus.ASSIGNED,
      trackingHistory: [
        ...(order.trackingHistory || []),
        {
          status: OrderStatus.ASSIGNED,
          timestamp: new Date(),
          remarks: `Order accepted by ${company.companyName}`,
        },
      ],
    } as any);

    // 🔔 PUSH NOTIFICATION: Order accepted by company
    try {
      // Notify buyer
      await this.notificationsService.sendPushNotification(
        order.buyerId,
        '📦 Your Order Has Been Accepted',
        `${company.companyName} has accepted your order #${order.id}`,
        {
          orderId: order.id,
          orderNumber: order.id,
          companyId: company.id,
          companyName: company.companyName,
          type: 'order_accepted_buyer',
        },
      );

      // Notify seller
      if (order.sellerId) {
        await this.notificationsService.sendPushNotification(
          order.sellerId,
          '✅ Order Accepted by Delivery Company',
          `${company.companyName} has accepted order #${order.id} for delivery`,
          {
            orderId: order.id,
            orderNumber: order.id,
            companyName: company.companyName,
            type: 'order_accepted_seller',
          },
        );
      }

      // Notify company owner
      await this.notificationsService.sendPushNotification(
        userId,
        '✅ Order Accepted',
        `You have accepted order #${order.id}. Assign a driver to proceed`,
        {
          orderId: order.id,
          orderNumber: order.id,
          type: 'order_accepted_company',
        },
      );

      this.logger.log(`Order acceptance notifications sent for order ${order.id}`);
    } catch (error) {
      this.logger.error('Failed to send order acceptance notifications:', error);
    }

    // Send email notifications (non-blocking)
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      // Fire and forget - don't wait for email to complete
      this.sendOrderInTransitNotifications(order, company).catch((error) => {
        console.error('Failed to send order in transit notifications:', error?.message || error);
      });
    }

    return order;
  }

  async getDrivers(companyId: string) {
    const drivers = await this.driverModel.findAll({
      where: { companyId },
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
    });

    return drivers.map((driver) => ({
      id: driver.id,
      userId: driver.userId,
      firstName: driver.user?.firstName || driver.name?.split(' ')[0] || '',
      lastName: driver.user?.lastName || driver.name?.split(' ')[1] || '',
      email: driver.user?.email || driver.email || '',
      phone: driver.user?.phone || driver.phone || '',
      name: driver.name,
      vehicleNumber: driver.vehicleNumber,
      licenseNumber: driver.licenseNumber,
      isActive: driver.isActive,
      isAvailable: driver.isAvailable,
      status: driver.isAvailable ? 'available' : 'busy',
      companyId: driver.companyId,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    }));
  }

  async getAllDrivers(page: number = 1, limit: number = 100, excludeCompanyId?: string) {
    const offset = (page - 1) * limit;

    const where: any = {};
    if (excludeCompanyId) {
      where[Op.or] = [{ companyId: null }, { companyId: { [Op.ne]: excludeCompanyId } }];
    }

    const { count, rows } = await this.driverModel.findAndCountAll({
      where,
      offset,
      limit,
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
      order: [['createdAt', 'DESC']],
    });

    const items = rows.map((driver) => ({
      id: driver.id,
      userId: driver.userId,
      firstName: driver.user?.firstName || driver.name?.split(' ')[0] || '',
      lastName: driver.user?.lastName || driver.name?.split(' ')[1] || '',
      email: driver.user?.email || driver.email || '',
      phone: driver.user?.phone || driver.phone || '',
      name: driver.name,
      vehicleNumber: driver.vehicleNumber,
      licenseNumber: driver.licenseNumber,
      isActive: driver.isActive,
      isAvailable: driver.isAvailable,
      status: driver.isAvailable ? 'available' : 'busy',
      companyId: driver.companyId,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    }));

    return {
      items,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async inviteDriver(companyId: string, driverId: string, message?: string) {
    const driver = await this.driverModel.findByPk(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    await driver.update({
      companyId,
    });

    // 🔔 PUSH NOTIFICATION: Driver invited
    try {
      const company = await this.deliveryCompanyModel.findByPk(companyId);

      if (driver.userId) {
        await this.notificationsService.sendPushNotification(
          driver.userId,
          '📬 Company Invitation',
          `${company?.companyName || 'A company'} has invited you to join their team`,
          {
            companyId,
            companyName: company?.companyName,
            driverId: driver.id,
            message: message || '',
            type: 'driver_invited',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send driver invitation notification:', error);
    }

    return {
      id: driver.id,
      driverId: driver.id,
      companyId,
      message,
      status: 'accepted',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  async getDashboardStats(companyId: string) {
    const [totalOrders, pendingOrders, completedOrders, totalDrivers, availableDrivers] =
      await Promise.all([
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
        this.driverModel.count({
          where: {
            companyId,
            isActive: true,
            isAvailable: true,
          },
        }),
      ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalDrivers,
      availableDrivers,
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
  }

  // Notify company when driver completes delivery
  async notifyDeliveryComplete(companyId: string, orderId: string, driverName: string) {
    try {
      const company = await this.deliveryCompanyModel.findByPk(companyId);

      if (company?.userId) {
        await this.notificationsService.sendPushNotification(
          company.userId,
          '✅ Delivery Completed',
          `${driverName} has completed delivery for order #${orderId}`,
          {
            orderId,
            driverName,
            companyId,
            type: 'company_delivery_completed',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send delivery completion notification:', error);
    }
  }

  // Daily summary for companies
  @Cron(CronExpression.EVERY_DAY_AT_8PM)
  async sendDailySummaries() {
    this.logger.log('Sending daily summaries to delivery companies...');

    const companies = await this.deliveryCompanyModel.findAll({
      where: { isActive: true },
    });

    for (const company of companies) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [todayOrders, todayDeliveries, activeDrivers] = await Promise.all([
          this.orderModel.count({
            where: {
              deliveryCompanyId: company.id,
              createdAt: { [Op.gte]: today },
            },
          }),
          this.orderModel.count({
            where: {
              deliveryCompanyId: company.id,
              status: OrderStatus.DELIVERED,
              deliveredAt: { [Op.gte]: today },
            },
          }),
          this.driverModel.count({
            where: {
              companyId: company.id,
              isActive: true,
            },
          }),
        ]);

        // 🔔 PUSH NOTIFICATION: Daily summary
        await this.notificationsService.sendPushNotification(
          company.userId,
          "📊 Today's Summary",
          `${todayOrders} new orders, ${todayDeliveries} deliveries completed today`,
          {
            companyId: company.id,
            todayOrders,
            todayDeliveries,
            activeDrivers,
            type: 'daily_summary',
          },
        );

        this.logger.log(`Daily summary sent to company ${company.id}`);
      } catch (error) {
        this.logger.error(`Failed to send daily summary to company ${company.id}:`, error);
      }
    }
  }

  private async sendOrderInTransitNotifications(
    order: Order & { buyer?: User; seller?: User },
    company: DeliveryCompany,
  ) {
    const trackingLink = `${process.env.FRONTEND_URL || 'https://alabamarketplace.com'}/tracking/${order.id}`;

    if (order.buyer?.email) {
      await this.mailerService.sendMail({
        to: order.buyer.email,
        subject: 'Your Order is in Transit 📦',
        template: 'order-in-transit',
        context: {
          buyerName: order.buyer.firstName || 'Valued Customer',
          orderNumber: order.id,
          companyName: company.companyName || 'Our Delivery Company',
          trackingLink,
          deliveryAddress: order.deliveryAddress,
        },
      });
    }

    if (order.seller?.email) {
      await this.mailerService.sendMail({
        to: order.seller.email,
        subject: 'Order Accepted for Delivery - In Transit 📦',
        template: 'order-in-transit',
        context: {
          sellerName: order.seller.firstName || 'Seller',
          orderNumber: order.id,
          companyName: company.companyName || 'Our Delivery Company',
          trackingLink,
          deliveryAddress: order.deliveryAddress,
        },
      });
    }
  }

  // Get all active companies (for drivers to browse)
  async getAllActiveCompanies(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await this.deliveryCompanyModel.findAndCountAll({
      where: {
        isActive: true,
        subscriptionStatus: {
          [Op.in]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.FREE_TRIAL],
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: Driver,
          as: 'drivers',
          attributes: ['id'],
        },
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return {
      companies: rows.map((company) => ({
        id: company.id,
        companyName: company.companyName,
        description: company.description,
        logo: company.logo,
        routes: company.routes,
        subscriptionStatus: company.subscriptionStatus,
        driverCount: company.drivers?.length || 0,
        createdAt: company.createdAt,
      })),
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
    };
  }

  // Get driver applications for a company
  async getDriverApplications(companyId: string) {
    const { DriverInvitation } = require('../drivers/entities/driver-invitation.entity');

    return DriverInvitation.findAll({
      where: { companyId, status: 'pending' },
      include: [
        {
          model: User,
          as: 'driverUser',
          attributes: ['id', 'email', 'firstName', 'lastName', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  // Accept driver application
  async acceptDriverApplication(companyId: string, applicationId: string) {
    const { DriverInvitation } = require('../drivers/entities/driver-invitation.entity');

    const application = await DriverInvitation.findOne({
      where: { id: applicationId, companyId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== 'pending') {
      throw new BadRequestException('Application has already been processed');
    }

    // Update application status
    application.status = 'accepted';
    await application.save();

    // Create driver profile if doesn't exist
    let driver = await this.driverModel.findOne({
      where: { userId: application.driverUserId, companyId },
    });

    if (!driver) {
      const user = await this.userModel.findByPk(application.driverUserId);
      driver = await this.driverModel.create({
        userId: application.driverUserId,
        companyId,
        name: user?.firstName || user?.email || 'Driver',
        phone: user?.phone || '',
        email: user?.email || '',
        licenseNumber: '',
        isActive: true,
        isAvailable: true,
      } as any);
    }

    // Notify driver
    try {
      const company = await this.deliveryCompanyModel.findByPk(companyId);

      // Send push notification
      await this.notificationsService.sendPushNotification(
        application.driverUserId,
        '🎉 Application Accepted!',
        `${company?.companyName || 'Company'} accepted your driver application`,
        {
          applicationId: application.id,
          companyId,
          companyName: company?.companyName,
          driverId: driver.id,
          type: 'application_accepted',
        },
      );

      // Create in-app notification
      await this.notificationsService.create(
        {
          title: '🎉 Application Accepted!',
          message: `Congratulations! You are now a driver for ${company?.companyName || 'Company'}`,
          type: 'invitation',
          actionUrl: `/company/${companyId}`,
          data: {
            applicationId: application.id,
            companyId,
            driverId: driver.id,
          },
        },
        application.driverUserId,
      );

      this.logger.log(`✅ Sent acceptance notification to driver ${application.driverUserId}`);
    } catch (error) {
      this.logger.error('Failed to send application acceptance notification:', error);
    }

    return { application, driver };
  }

  // Reject driver application
  async rejectDriverApplication(companyId: string, applicationId: string) {
    const { DriverInvitation } = require('../drivers/entities/driver-invitation.entity');

    const application = await DriverInvitation.findOne({
      where: { id: applicationId, companyId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== 'pending') {
      throw new BadRequestException('Application has already been processed');
    }

    // Update application status
    application.status = 'rejected';
    await application.save();

    // Notify driver
    try {
      const company = await this.deliveryCompanyModel.findByPk(companyId);

      // Send push notification
      await this.notificationsService.sendPushNotification(
        application.driverUserId,
        'Application Update',
        `${company?.companyName || 'Company'} reviewed your application`,
        {
          applicationId: application.id,
          companyId,
          type: 'application_rejected',
        },
      );

      // Create in-app notification
      await this.notificationsService.create(
        {
          title: 'Application Status Update',
          message: `Your application to ${company?.companyName || 'Company'} was not accepted at this time. Thank you for your interest.`,
          type: 'invitation',
          data: {
            applicationId: application.id,
            companyId,
            status: 'rejected',
          },
        },
        application.driverUserId,
      );

      this.logger.log(`📧 Sent rejection notification to driver ${application.driverUserId}`);
    } catch (error) {
      this.logger.error('Failed to send application rejection notification:', error);
    }

    return application;
  }
}
