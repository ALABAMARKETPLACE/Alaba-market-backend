// // // =====================================================
// // // FILE: backend/src/modules/drivers/drivers.service.ts
// // // =====================================================
// // import {
// //   Injectable,
// //   NotFoundException,
// //   ForbiddenException,
// //   BadRequestException,
// // } from '@nestjs/common';
// // import { InjectModel } from '@nestjs/sequelize';
// // import { Driver } from './entities/driver.entity';
// // import { DriverInvitation } from './entities/driver-invitation.entity';
// // import { DeliveryCompany } from '..//delivery/entities/delivery-compnay-entity';
// // import { Order } from '../orders/entities/order-entity';
// // import { User } from '../users/entities/user-entity';
// // import { CreateDriverDto } from './dto/create-driver.dto';
// // import { UpdateDriverDto } from './dto/update-driver.dto';
// // import { AssignDriverDto, UpdateAvailabilityDto } from '../delivery/dto/assigned-driver.dto';
// // import { OrderStatus } from '../../enums/order-status';
// // import { Op } from 'sequelize';

// // @Injectable()
// // export class DriversService {
// //   constructor(
// //     @InjectModel(Driver)
// //     private driverModel: typeof Driver,
// //     @InjectModel(DriverInvitation)
// //     private invitationModel: typeof DriverInvitation,
// //     @InjectModel(DeliveryCompany)
// //     private companyModel: typeof DeliveryCompany,
// //     @InjectModel(Order)
// //     private orderModel: typeof Order,
// //     @InjectModel(User)
// //     private userModel: typeof User,
// //   ) {}

// //   async getDriverIdByUserId(userId: string): Promise<string | null> {
// //     // Prefer driver records with a company (active drivers)
// //     const driver = await this.driverModel.findOne({
// //       where: { userId },
// //       order: [
// //         // Prioritize records with companyId
// //         [
// //           this.driverModel.sequelize.literal('CASE WHEN "companyId" IS NOT NULL THEN 0 ELSE 1 END'),
// //           'ASC',
// //         ],
// //         ['createdAt', 'DESC'],
// //       ],
// //     });
// //     return driver ? driver.id : null;
// //   }

// //   async create(dto: CreateDriverDto, companyId: string): Promise<Driver> {
// //     const company = await this.companyModel.findByPk(companyId);

// //     if (!company) {
// //       throw new NotFoundException('Delivery company not found');
// //     }

// //     // Check for duplicate phone within same company
// //     const existingDriver = await this.driverModel.findOne({
// //       where: {
// //         companyId,
// //         phone: dto.phone,
// //       },
// //     });

// //     if (existingDriver) {
// //       throw new BadRequestException('Driver with this phone already exists in your company');
// //     }

// //     const driver = await this.driverModel.create({
// //       ...dto,
// //       companyId,
// //       isActive: true,
// //       isAvailable: true,
// //     } as any);

// //     return driver;
// //   }

// //   async findAll(companyId: string, filters?: { isAvailable?: boolean }): Promise<Driver[]> {
// //     const where: any = { companyId };

// //     if (filters?.isAvailable !== undefined) {
// //       where.isAvailable = filters.isAvailable;
// //     }

// //     return this.driverModel.findAll({
// //       where,
// //       include: [{ model: DeliveryCompany, as: 'company' }, { model: User }],
// //       order: [['createdAt', 'DESC']],
// //     });
// //   }

// //   async findById(driverId: string): Promise<Driver> {
// //     const driver = await this.driverModel.findByPk(driverId, {
// //       include: [{ model: DeliveryCompany, as: 'company' }, { model: User }],
// //     });

// //     if (!driver) {
// //       throw new NotFoundException('Driver not found');
// //     }

// //     return driver;
// //   }

// //   async findAvailableDrivers(companyId: string): Promise<Driver[]> {
// //     return this.driverModel.findAll({
// //       where: {
// //         companyId,
// //         isActive: true,
// //         isAvailable: true,
// //       },
// //       order: [['createdAt', 'ASC']],
// //     });
// //   }

// //   async update(driverId: string, companyId: string, dto: UpdateDriverDto): Promise<Driver> {
// //     const driver = await this.driverModel.findByPk(driverId);

// //     if (!driver) {
// //       throw new NotFoundException('Driver not found');
// //     }

// //     if (driver.companyId !== companyId) {
// //       throw new ForbiddenException('Not authorized to update this driver');
// //     }

// //     // Check for duplicate phone if phone is being updated
// //     if (dto.phone && dto.phone !== driver.phone) {
// //       const existingDriver = await this.driverModel.findOne({
// //         where: {
// //           companyId,
// //           phone: dto.phone,
// //           id: { [Op.ne]: driverId },
// //         },
// //       });

// //       if (existingDriver) {
// //         throw new BadRequestException('Driver with this phone already exists in your company');
// //       }
// //     }

// //     await driver.update(dto);
// //     return driver;
// //   }

// //   async delete(driverId: string, companyId: string): Promise<void> {
// //     const driver = await this.driverModel.findByPk(driverId);

// //     if (!driver) {
// //       throw new NotFoundException('Driver not found');
// //     }

// //     if (driver.companyId !== companyId) {
// //       throw new ForbiddenException('Not authorized to delete this driver');
// //     }

// //     // Check if driver has active deliveries
// //     const activeDeliveries = await this.orderModel.count({
// //       where: {
// //         driverId,
// //         status: {
// //           [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
// //         },
// //       },
// //     });

// //     if (activeDeliveries > 0) {
// //       throw new BadRequestException('Cannot delete driver with active deliveries');
// //     }

// //     await driver.update({ isActive: false });
// //   }

// //   async getAssignedDeliveries(driverId: string): Promise<Order[]> {
// //     console.log('🚚 getAssignedDeliveries called for driverId:', driverId);
// //     if (!driverId) {
// //       throw new BadRequestException('Driver ID is required');
// //     }
// //     const deliveries = await this.orderModel.findAll({
// //       where: {
// //         driverId,
// //         status: {
// //           [Op.in]: [
// //             OrderStatus.ASSIGNED,
// //             OrderStatus.PACKAGE_RECEIVED,
// //             OrderStatus.PICKED_UP,
// //             OrderStatus.OUT_FOR_DELIVERY,
// //           ],
// //         },
// //       },
// //       include: [
// //         { model: User, as: 'buyer' },
// //         { model: User, as: 'seller' },
// //         { model: DeliveryCompany },
// //       ],
// //       order: [['assignedAt', 'DESC']],
// //     });
// //     console.log('🚚 Found', deliveries.length, 'assigned deliveries for driver');
// //     return deliveries;
// //   }

// //   async getDeliveryHistory(driverId: string, limit: number = 50): Promise<Order[]> {
// //     if (!driverId) {
// //       throw new BadRequestException('Driver ID is required');
// //     }
// //     return this.orderModel.findAll({
// //       where: {
// //         driverId,
// //         status: {
// //           [Op.in]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
// //         },
// //       },
// //       include: [
// //         { model: User, as: 'buyer' },
// //         { model: User, as: 'seller' },
// //       ],
// //       order: [['deliveredAt', 'DESC']],
// //       limit,
// //     });
// //   }

// //   async updateAvailability(driverId: string, dto: UpdateAvailabilityDto): Promise<Driver> {
// //     if (!driverId) {
// //       throw new BadRequestException('Driver ID is required');
// //     }
// //     const driver = await this.driverModel.findByPk(driverId);

// //     if (!driver) {
// //       throw new NotFoundException('Driver not found');
// //     }

// //     // Can't set available if there are active deliveries
// //     if (dto.isAvailable === true) {
// //       const activeDeliveries = await this.orderModel.count({
// //         where: {
// //           driverId,
// //           status: {
// //             [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
// //           },
// //         },
// //       });

// //       if (activeDeliveries > 0) {
// //         throw new BadRequestException('Cannot set available while having active deliveries');
// //       }
// //     }

// //     await driver.update({ isAvailable: dto.isAvailable });
// //     return driver;
// //   }

// //   // COMPANY SIDE: invite-based driver marketplace

// //   // List all driver users (directory), optionally filtered by search text
// //   async findDriverDirectory(search?: string) {
// //     const where: any = { role: 'driver' };
// //     if (search) {
// //       where[Op.or] = [
// //         { firstName: { [Op.iLike]: `%${search}%` } },
// //         { lastName: { [Op.iLike]: `%${search}%` } },
// //         { email: { [Op.iLike]: `%${search}%` } },
// //       ];
// //     }

// //     const users = await this.userModel.findAll({ where, order: [['createdAt', 'DESC']] });

// //     // For simplicity, just return users; frontend can show invite button per user
// //     return users;
// //   }

// //   async inviteDriver(companyUserId: string, driverUserId: string, message?: string) {
// //     console.log('🔧 Backend inviteDriver called:', { companyUserId, driverUserId, message });

// //     const company = await this.companyModel.findOne({ where: { userId: companyUserId } });
// //     console.log(
// //       '🔧 Company found:',
// //       company ? { id: company.id, userId: company.userId, name: company.companyName } : 'NOT FOUND',
// //     );

// //     if (!company) {
// //       throw new NotFoundException('Delivery company not found for this user');
// //     }

// //     // Prevent duplicate pending invites
// //     const existing = await this.invitationModel.findOne({
// //       where: {
// //         companyId: company.id,
// //         driverUserId,
// //         status: 'pending',
// //       },
// //     });
// //     console.log(
// //       '🔧 Existing invitation:',
// //       existing ? { id: existing.id, status: existing.status } : 'NONE',
// //     );

// //     if (existing) {
// //       console.log('🔧 Returning existing invitation');
// //       return existing;
// //     }

// //     console.log('🔧 Creating new invitation:', {
// //       companyId: company.id,
// //       driverUserId,
// //       status: 'pending',
// //     });
// //     const invite = await this.invitationModel.create({
// //       companyId: company.id,
// //       driverUserId,
// //       status: 'pending',
// //       message: message || null,
// //     } as any);
// //     console.log('🔧 Invitation created:', {
// //       id: invite.id,
// //       companyId: invite.companyId,
// //       driverUserId: invite.driverUserId,
// //     });

// //     return invite;
// //   }

// //   async getInvitationsForDriver(driverUserId: string) {
// //     console.log('🔧 Backend getInvitationsForDriver called for userId:', driverUserId);

// //     if (!driverUserId) {
// //       throw new BadRequestException('Driver user ID is required');
// //     }

// //     const invitations = await this.invitationModel.findAll({
// //       where: { driverUserId },
// //       include: [{ model: DeliveryCompany, as: 'company' }],
// //       order: [['createdAt', 'DESC']],
// //     });

// //     console.log('🔧 Found invitations:', invitations.length);
// //     if (invitations.length > 0) {
// //       console.log('🔧 First invitation:', {
// //         id: invitations[0].id,
// //         driverUserId: invitations[0].driverUserId,
// //         companyId: invitations[0].companyId,
// //         status: invitations[0].status,
// //         companyName: invitations[0].company?.companyName,
// //       });
// //     }

// //     return invitations;
// //   }

// //   async acceptInvitation(driverUserId: string, invitationId: string): Promise<Driver> {
// //     console.log('🔔 acceptInvitation called:', { driverUserId, invitationId });

// //     const invite = await this.invitationModel.findByPk(invitationId);
// //     if (!invite || invite.driverUserId !== driverUserId) {
// //       throw new NotFoundException('Invitation not found');
// //     }

// //     console.log('🔔 Invitation found:', {
// //       companyId: invite.companyId,
// //       status: invite.status,
// //     });

// //     // Mark invite as accepted
// //     await invite.update({ status: 'accepted' } as any);

// //     // Look for ANY existing driver record for this user (even without company)
// //     let driver = await this.driverModel.findOne({
// //       where: { userId: driverUserId },
// //     });

// //     console.log('🔔 Existing driver found:', {
// //       hasDriver: !!driver,
// //       driverId: driver?.id,
// //       currentCompanyId: driver?.companyId,
// //     });

// //     if (driver) {
// //       // Update existing driver with the company
// //       if (driver.companyId !== invite.companyId) {
// //         await driver.update({
// //           companyId: invite.companyId,
// //           isActive: true,
// //           isAvailable: true,
// //         });
// //         console.log('✅ Updated existing driver with companyId:', invite.companyId);
// //       } else {
// //         console.log('✅ Driver already linked to this company');
// //       }
// //     } else {
// //       // No driver record exists - create new one
// //       const user = await this.userModel.findByPk(driverUserId);
// //       const derivedName =
// //         (user && `${user.firstName || ''} ${user.lastName || ''}`.trim()) ||
// //         (user && user.email) ||
// //         'Driver';

// //       driver = await this.driverModel.create({
// //         companyId: invite.companyId,
// //         userId: driverUserId,
// //         name: derivedName,
// //         phone: '', // can be updated later by company/driver
// //         email: user ? user.email : null,
// //         isActive: true,
// //         isAvailable: true,
// //       } as any);

// //       console.log('✅ Created new driver record:', driver.id);
// //     }

// //     return driver;
// //   }

// //   async assignToOrder(dto: AssignDriverDto): Promise<Order> {
// //     console.log('🚗 assignToOrder called:', dto);

// //     const [order, driver] = await Promise.all([
// //       this.orderModel.findByPk(dto.orderId),
// //       this.driverModel.findByPk(dto.driverId),
// //     ]);

// //     console.log('🚗 Order found:', {
// //       orderId: order?.id,
// //       status: order?.status,
// //       deliveryCompanyId: order?.deliveryCompanyId,
// //       currentDriverId: order?.driverId,
// //     });

// //     console.log('🚗 Driver found:', {
// //       driverId: driver?.id,
// //       name: driver?.name,
// //       companyId: driver?.companyId,
// //       isActive: driver?.isActive,
// //       isAvailable: driver?.isAvailable,
// //     });

// //     if (!order) {
// //       console.log('❌ Order not found');
// //       throw new NotFoundException('Order not found');
// //     }

// //     if (!driver) {
// //       console.log('❌ Driver not found');
// //       throw new NotFoundException('Driver not found');
// //     }

// //     console.log('🚗 Checking company match:', {
// //       orderCompanyId: order.deliveryCompanyId,
// //       driverCompanyId: driver.companyId,
// //       matches: order.deliveryCompanyId === driver.companyId,
// //     });

// //     if (order.deliveryCompanyId !== driver.companyId) {
// //       console.log('❌ Company mismatch - Driver does not belong to assigned company');
// //       throw new ForbiddenException('Driver does not belong to assigned company');
// //     }

// //     if (!driver.isActive || !driver.isAvailable) {
// //       console.log('❌ Driver not available:', {
// //         isActive: driver.isActive,
// //         isAvailable: driver.isAvailable,
// //       });
// //       throw new BadRequestException('Driver is not available for assignment');
// //     }

// //     console.log('✅ All validations passed, updating order...');

// //     await order.update({
// //       driverId: driver.id,
// //       status: OrderStatus.ASSIGNED,
// //       assignedAt: new Date(),
// //       trackingHistory: [
// //         ...order.trackingHistory,
// //         {
// //           status: OrderStatus.ASSIGNED,
// //           timestamp: new Date(),
// //           remarks: `Assigned to driver: ${driver.name}`,
// //         },
// //       ],
// //     });

// //     console.log('✅ Order assigned successfully to driver:', driver.name);

// //     // Keep driver available for now
// //     // They will become unavailable when they confirm package receipt
// //     // await driver.update({ isAvailable: false });

// //     return order;
// //   }

// //   async getDriverStats(driverId: string): Promise<any> {
// //     if (!driverId) {
// //       throw new BadRequestException('Driver ID is required');
// //     }
// //     const [totalDeliveries, completedDeliveries, failedDeliveries, pendingDeliveries, driver] =
// //       await Promise.all([
// //         this.orderModel.count({ where: { driverId } }),
// //         this.orderModel.count({
// //           where: { driverId, status: OrderStatus.DELIVERED },
// //         }),
// //         this.orderModel.count({
// //           where: { driverId, status: OrderStatus.FAILED },
// //         }),
// //         this.orderModel.count({
// //           where: {
// //             driverId,
// //             status: {
// //               [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
// //             },
// //           },
// //         }),
// //         this.driverModel.findByPk(driverId),
// //       ]);

// //     if (!driver) {
// //       throw new NotFoundException('Driver not found');
// //     }

// //     const successRate =
// //       totalDeliveries > 0 ? ((completedDeliveries / totalDeliveries) * 100).toFixed(2) : 0;

// //     return {
// //       driverId: driver.id,
// //       driverName: driver.name,
// //       isAvailable: driver.isAvailable,
// //       totalDeliveries,
// //       completedDeliveries,
// //       failedDeliveries,
// //       pendingDeliveries,
// //       successRate: `${successRate}%`,
// //     };
// //   }
// // }

// // =====================================================
// // FILE: backend/src/modules/drivers/drivers.service.ts
// // =====================================================
// import {
//   Injectable,
//   NotFoundException,
//   ForbiddenException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/sequelize';
// import { Driver } from './entities/driver.entity';
// import { DriverInvitation } from './entities/driver-invitation.entity';
// import { DeliveryCompany } from '..//delivery/entities/delivery-compnay-entity';
// import { Order } from '../orders/entities/order-entity';
// import { User } from '../users/entities/user-entity';
// import { CreateDriverDto } from './dto/create-driver.dto';
// import { UpdateDriverDto } from './dto/update-driver.dto';
// import { AssignDriverDto, UpdateAvailabilityDto } from '../delivery/dto/assigned-driver.dto';
// import { OrderStatus } from '../../enums/order-status';
// import { Op } from 'sequelize';

// @Injectable()
// export class DriversService {
//   constructor(
//     @InjectModel(Driver)
//     private driverModel: typeof Driver,
//     @InjectModel(DriverInvitation)
//     private invitationModel: typeof DriverInvitation,
//     @InjectModel(DeliveryCompany)
//     private companyModel: typeof DeliveryCompany,
//     @InjectModel(Order)
//     private orderModel: typeof Order,
//     @InjectModel(User)
//     private userModel: typeof User,
//   ) {}

//   async getDriverIdByUserId(userId: string): Promise<string | null> {
//     // Prefer driver records with a company (active drivers)
//     const driver = await this.driverModel.findOne({
//       where: { userId },
//       order: [
//         // Prioritize records with companyId
//         [
//           this.driverModel.sequelize.literal('CASE WHEN "companyId" IS NOT NULL THEN 0 ELSE 1 END'),
//           'ASC',
//         ],
//         ['createdAt', 'DESC'],
//       ],
//     });
//     return driver ? driver.id : null;
//   }

//   async create(dto: CreateDriverDto, companyId: string): Promise<Driver> {
//     const company = await this.companyModel.findByPk(companyId);

//     if (!company) {
//       throw new NotFoundException('Delivery company not found');
//     }

//     // Check for duplicate phone within same company
//     const existingDriver = await this.driverModel.findOne({
//       where: {
//         companyId,
//         phone: dto.phone,
//       },
//     });

//     if (existingDriver) {
//       throw new BadRequestException('Driver with this phone already exists in your company');
//     }

//     const driver = await this.driverModel.create({
//       ...dto,
//       companyId,
//       isActive: true,
//       isAvailable: true,
//     } as any);

//     return driver;
//   }

//   async findAll(companyId: string, filters?: { isAvailable?: boolean }): Promise<Driver[]> {
//     const where: any = { companyId };

//     if (filters?.isAvailable !== undefined) {
//       where.isAvailable = filters.isAvailable;
//     }

//     return this.driverModel.findAll({
//       where,
//       include: [{ model: DeliveryCompany, as: 'company' }, { model: User }],
//       order: [['createdAt', 'DESC']],
//     });
//   }

//   async findById(driverId: string): Promise<Driver> {
//     const driver = await this.driverModel.findByPk(driverId, {
//       include: [{ model: DeliveryCompany, as: 'company' }, { model: User }],
//     });

//     if (!driver) {
//       throw new NotFoundException('Driver not found');
//     }

//     return driver;
//   }

//   async findAvailableDrivers(companyId: string): Promise<Driver[]> {
//     return this.driverModel.findAll({
//       where: {
//         companyId,
//         isActive: true,
//         isAvailable: true,
//       },
//       order: [['createdAt', 'ASC']],
//     });
//   }

//   async update(driverId: string, companyId: string, dto: UpdateDriverDto): Promise<Driver> {
//     const driver = await this.driverModel.findByPk(driverId);

//     if (!driver) {
//       throw new NotFoundException('Driver not found');
//     }

//     if (driver.companyId !== companyId) {
//       throw new ForbiddenException('Not authorized to update this driver');
//     }

//     // Check for duplicate phone if phone is being updated
//     if (dto.phone && dto.phone !== driver.phone) {
//       const existingDriver = await this.driverModel.findOne({
//         where: {
//           companyId,
//           phone: dto.phone,
//           id: { [Op.ne]: driverId },
//         },
//       });

//       if (existingDriver) {
//         throw new BadRequestException('Driver with this phone already exists in your company');
//       }
//     }

//     await driver.update(dto);
//     return driver;
//   }

//   async delete(driverId: string, companyId: string): Promise<void> {
//     const driver = await this.driverModel.findByPk(driverId);

//     if (!driver) {
//       throw new NotFoundException('Driver not found');
//     }

//     if (driver.companyId !== companyId) {
//       throw new ForbiddenException('Not authorized to delete this driver');
//     }

//     // Check if driver has active deliveries
//     const activeDeliveries = await this.orderModel.count({
//       where: {
//         driverId: driverId,
//         status: {
//           [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
//         },
//       } as any,
//     });

//     if (activeDeliveries > 0) {
//       throw new BadRequestException('Cannot delete driver with active deliveries');
//     }

//     await driver.update({ isActive: false });
//   }

//   async getAssignedDeliveries(driverId: string): Promise<Order[]> {
//     console.log('🚚 getAssignedDeliveries called for driverId:', driverId);
//     if (!driverId) {
//       throw new BadRequestException('Driver ID is required');
//     }
//     const deliveries = await this.orderModel.findAll({
//       where: {
//         driverId: driverId,
//         status: {
//           [Op.in]: [
//             OrderStatus.ASSIGNED,
//             OrderStatus.PACKAGE_RECEIVED,
//             OrderStatus.PICKED_UP,
//             OrderStatus.OUT_FOR_DELIVERY,
//           ],
//         },
//       } as any,
//       include: [
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//         { model: DeliveryCompany },
//       ],
//       order: [['assignedAt', 'DESC']],
//     });
//     console.log('🚚 Found', deliveries.length, 'assigned deliveries for driver');
//     return deliveries;
//   }

//   async getDeliveryHistory(driverId: string, limit: number = 50): Promise<Order[]> {
//     if (!driverId) {
//       throw new BadRequestException('Driver ID is required');
//     }
//     return this.orderModel.findAll({
//       where: {
//         driverId: driverId,
//         status: {
//           [Op.in]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
//         },
//       } as any,
//       include: [
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//       ],
//       order: [['deliveredAt', 'DESC']],
//       limit,
//     });
//   }

//   async updateAvailability(driverId: string, dto: UpdateAvailabilityDto): Promise<Driver> {
//     if (!driverId) {
//       throw new BadRequestException('Driver ID is required');
//     }
//     const driver = await this.driverModel.findByPk(driverId);

//     if (!driver) {
//       throw new NotFoundException('Driver not found');
//     }

//     // Can't set available if there are active deliveries
//     if (dto.isAvailable === true) {
//       const activeDeliveries = await this.orderModel.count({
//         where: {
//           driverId: driverId,
//           status: {
//             [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
//           },
//         } as any,
//       });

//       if (activeDeliveries > 0) {
//         throw new BadRequestException('Cannot set available while having active deliveries');
//       }
//     }

//     await driver.update({ isAvailable: dto.isAvailable });
//     return driver;
//   }

//   // COMPANY SIDE: invite-based driver marketplace

//   // List all driver users (directory), optionally filtered by search text
//   async findDriverDirectory(search?: string) {
//     const where: any = { role: 'driver' };
//     if (search) {
//       where[Op.or] = [
//         { firstName: { [Op.iLike]: `%${search}%` } },
//         { lastName: { [Op.iLike]: `%${search}%` } },
//         { email: { [Op.iLike]: `%${search}%` } },
//       ];
//     }

//     const users = await this.userModel.findAll({ where, order: [['createdAt', 'DESC']] });

//     // For simplicity, just return users; frontend can show invite button per user
//     return users;
//   }

//   async inviteDriver(companyUserId: string, driverUserId: string, message?: string) {
//     console.log('🔧 Backend inviteDriver called:', { companyUserId, driverUserId, message });

//     const company = await this.companyModel.findOne({ where: { userId: companyUserId } });
//     console.log(
//       '🔧 Company found:',
//       company ? { id: company.id, userId: company.userId, name: company.companyName } : 'NOT FOUND',
//     );

//     if (!company) {
//       throw new NotFoundException('Delivery company not found for this user');
//     }

//     // Prevent duplicate pending invites
//     const existing = await this.invitationModel.findOne({
//       where: {
//         companyId: company.id,
//         driverUserId,
//         status: 'pending',
//       },
//     });
//     console.log(
//       '🔧 Existing invitation:',
//       existing ? { id: existing.id, status: existing.status } : 'NONE',
//     );

//     if (existing) {
//       console.log('🔧 Returning existing invitation');
//       return existing;
//     }

//     console.log('🔧 Creating new invitation:', {
//       companyId: company.id,
//       driverUserId,
//       status: 'pending',
//     });
//     const invite = await this.invitationModel.create({
//       companyId: company.id,
//       driverUserId,
//       status: 'pending',
//       message: message || null,
//     } as any);
//     console.log('🔧 Invitation created:', {
//       id: invite.id,
//       companyId: invite.companyId,
//       driverUserId: invite.driverUserId,
//     });

//     return invite;
//   }

//   async getInvitationsForDriver(driverUserId: string) {
//     console.log('🔧 Backend getInvitationsForDriver called for userId:', driverUserId);

//     if (!driverUserId) {
//       throw new BadRequestException('Driver user ID is required');
//     }

//     const invitations = await this.invitationModel.findAll({
//       where: { driverUserId },
//       include: [{ model: DeliveryCompany, as: 'company' }],
//       order: [['createdAt', 'DESC']],
//     });

//     console.log('🔧 Found invitations:', invitations.length);
//     if (invitations.length > 0) {
//       console.log('🔧 First invitation:', {
//         id: invitations[0].id,
//         driverUserId: invitations[0].driverUserId,
//         companyId: invitations[0].companyId,
//         status: invitations[0].status,
//         companyName: invitations[0].company?.companyName,
//       });
//     }

//     return invitations;
//   }

//   async acceptInvitation(driverUserId: string, invitationId: string): Promise<Driver> {
//     console.log('🔔 acceptInvitation called:', { driverUserId, invitationId });

//     const invite = await this.invitationModel.findByPk(invitationId);
//     if (!invite || invite.driverUserId !== driverUserId) {
//       throw new NotFoundException('Invitation not found');
//     }

//     console.log('🔔 Invitation found:', {
//       companyId: invite.companyId,
//       status: invite.status,
//     });

//     // Mark invite as accepted
//     await invite.update({ status: 'accepted' } as any);

//     // Look for ANY existing driver record for this user (even without company)
//     let driver = await this.driverModel.findOne({
//       where: { userId: driverUserId },
//     });

//     console.log('🔔 Existing driver found:', {
//       hasDriver: !!driver,
//       driverId: driver?.id,
//       currentCompanyId: driver?.companyId,
//     });

//     if (driver) {
//       // Update existing driver with the company
//       if (driver.companyId !== invite.companyId) {
//         await driver.update({
//           companyId: invite.companyId,
//           isActive: true,
//           isAvailable: true,
//         });
//         console.log('✅ Updated existing driver with companyId:', invite.companyId);
//       } else {
//         console.log('✅ Driver already linked to this company');
//       }
//     } else {
//       // No driver record exists - create new one
//       const user = await this.userModel.findByPk(driverUserId);
//       const derivedName =
//         (user && `${user.firstName || ''} ${user.lastName || ''}`.trim()) ||
//         (user && user.email) ||
//         'Driver';

//       driver = await this.driverModel.create({
//         companyId: invite.companyId,
//         userId: driverUserId,
//         name: derivedName,
//         phone: '', // can be updated later by company/driver
//         email: user ? user.email : null,
//         isActive: true,
//         isAvailable: true,
//       } as any);

//       console.log('✅ Created new driver record:', driver.id);
//     }

//     return driver;
//   }

//   async assignToOrder(dto: AssignDriverDto): Promise<Order> {
//     console.log('🚗 assignToOrder called:', dto);

//     const [order, driver] = await Promise.all([
//       this.orderModel.findByPk(dto.orderId),
//       this.driverModel.findByPk(dto.driverId),
//     ]);

//     console.log('🚗 Order found:', {
//       orderId: order?.id,
//       status: order?.status,
//       deliveryCompanyId: order?.deliveryCompanyId,
//       driverId: (order as any)?.driverId,
//     });

//     console.log('🚗 Driver found:', {
//       driverId: driver?.id,
//       name: driver?.name,
//       companyId: driver?.companyId,
//       isActive: driver?.isActive,
//       isAvailable: driver?.isAvailable,
//     });

//     if (!order) {
//       console.log('❌ Order not found');
//       throw new NotFoundException('Order not found');
//     }

//     if (!driver) {
//       console.log('❌ Driver not found');
//       throw new NotFoundException('Driver not found');
//     }

//     console.log('🚗 Checking company match:', {
//       orderCompanyId: order.deliveryCompanyId,
//       driverCompanyId: driver.companyId,
//       matches: order.deliveryCompanyId === driver.companyId,
//     });

//     if (order.deliveryCompanyId !== driver.companyId) {
//       console.log('❌ Company mismatch - Driver does not belong to assigned company');
//       throw new ForbiddenException('Driver does not belong to assigned company');
//     }

//     if (!driver.isActive || !driver.isAvailable) {
//       console.log('❌ Driver not available:', {
//         isActive: driver.isActive,
//         isAvailable: driver.isAvailable,
//       });
//       throw new BadRequestException('Driver is not available for assignment');
//     }

//     console.log('✅ All validations passed, updating order...');

//     await order.update({
//       driverId: driver.id,
//       status: OrderStatus.ASSIGNED,
//       assignedAt: new Date(),
//       trackingHistory: [
//         ...(order.trackingHistory || []),
//         {
//           status: OrderStatus.ASSIGNED,
//           timestamp: new Date(),
//           remarks: `Assigned to driver: ${driver.name}`,
//         },
//       ],
//     } as any);

//     console.log('✅ Order assigned successfully to driver:', driver.name);

//     // Keep driver available for now
//     // They will become unavailable when they confirm package receipt
//     // await driver.update({ isAvailable: false });

//     return order;
//   }

//   async getDriverStats(driverId: string): Promise<any> {
//     if (!driverId) {
//       throw new BadRequestException('Driver ID is required');
//     }

//     const [totalDeliveries, completedDeliveries, failedDeliveries, pendingDeliveries, driver] =
//       await Promise.all([
//         this.orderModel.count({ where: { driverId: driverId } as any }),
//         this.orderModel.count({
//           where: { driverId: driverId, status: OrderStatus.DELIVERED } as any,
//         }),
//         this.orderModel.count({
//           where: { driverId: driverId, status: OrderStatus.FAILED } as any,
//         }),
//         this.orderModel.count({
//           where: {
//             driverId: driverId,
//             status: {
//               [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
//             },
//           } as any,
//         }),
//         this.driverModel.findByPk(driverId),
//       ]);

//     if (!driver) {
//       throw new NotFoundException('Driver not found');
//     }

//     const successRate =
//       totalDeliveries > 0 ? ((completedDeliveries / totalDeliveries) * 100).toFixed(2) : '0';

//     return {
//       driverId: driver.id,
//       driverName: driver.name,
//       isAvailable: driver.isAvailable,
//       totalDeliveries,
//       completedDeliveries,
//       failedDeliveries,
//       pendingDeliveries,
//       successRate: `${successRate}%`,
//     };
//   }
// }

// =====================================================
// FILE: backend/src/modules/drivers/drivers.service.ts
// =====================================================
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
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
import { NotificationsService } from '../notifications/notifications.service';
import { Op } from 'sequelize';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

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
    private notificationsService: NotificationsService,
  ) {}

  async getDriverIdByUserId(userId: string): Promise<string | null> {
    // Prefer driver records with a company (active drivers)
    const driver = await this.driverModel.findOne({
      where: { userId },
      order: [
        // Prioritize records with companyId
        [
          this.driverModel.sequelize.literal('CASE WHEN "companyId" IS NOT NULL THEN 0 ELSE 1 END'),
          'ASC',
        ],
        ['createdAt', 'DESC'],
      ],
    });
    return driver ? driver.id : null;
  }

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

    // 🔔 PUSH NOTIFICATION: New driver added to company
    try {
      // Notify company admin
      if (company.userId) {
        await this.notificationsService.sendPushNotification(
          company.userId,
          '👤 New Driver Added',
          `${driver.name} has been added to your team`,
          {
            driverId: driver.id,
            driverName: driver.name,
            companyId,
            type: 'driver_added',
          },
        );
      }

      // Notify the driver if they have a userId
      if (driver.userId) {
        await this.notificationsService.sendPushNotification(
          driver.userId,
          '🎉 Welcome to the Team!',
          `You've been added as a driver for ${company.companyName}`,
          {
            driverId: driver.id,
            companyId,
            companyName: company.companyName,
            type: 'driver_onboarded',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send driver creation notifications:', error);
    }

    return driver;
  }

  async findAll(companyId: string, filters?: { isAvailable?: boolean }): Promise<Driver[]> {
    const where: any = { companyId };

    if (filters?.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    return this.driverModel.findAll({
      where,
      include: [{ model: DeliveryCompany, as: 'company' }, { model: User }],
      order: [['createdAt', 'DESC']],
    });
  }

  async findById(driverId: string): Promise<Driver> {
    const driver = await this.driverModel.findByPk(driverId, {
      include: [{ model: DeliveryCompany, as: 'company' }, { model: User }],
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

    // 🔔 PUSH NOTIFICATION: Driver profile updated
    try {
      if (driver.userId) {
        await this.notificationsService.sendPushNotification(
          driver.userId,
          '📝 Profile Updated',
          'Your driver profile has been updated by your company',
          {
            driverId: driver.id,
            type: 'profile_updated',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send profile update notification:', error);
    }

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
        driverId: driverId,
        status: {
          [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
        },
      } as any,
    });

    if (activeDeliveries > 0) {
      throw new BadRequestException('Cannot delete driver with active deliveries');
    }

    await driver.update({ isActive: false });

    // 🔔 PUSH NOTIFICATION: Driver deactivated
    try {
      if (driver.userId) {
        const company = await this.companyModel.findByPk(companyId);
        await this.notificationsService.sendPushNotification(
          driver.userId,
          '⚠️ Account Deactivated',
          `Your driver account with ${company?.companyName || 'the company'} has been deactivated`,
          {
            driverId: driver.id,
            companyId,
            type: 'driver_deactivated',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send deactivation notification:', error);
    }
  }

  async getAssignedDeliveries(driverId: string): Promise<Order[]> {
    console.log('🚚 getAssignedDeliveries called for driverId:', driverId);
    if (!driverId) {
      throw new BadRequestException('Driver ID is required');
    }
    const deliveries = await this.orderModel.findAll({
      where: {
        driverId: driverId,
        status: {
          [Op.in]: [
            OrderStatus.ASSIGNED,
            OrderStatus.PACKAGE_RECEIVED,
            OrderStatus.PICKED_UP,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      } as any,
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: DeliveryCompany },
      ],
      order: [['assignedAt', 'DESC']],
    });
    console.log('🚚 Found', deliveries.length, 'assigned deliveries for driver');
    return deliveries;
  }

  async getDeliveryHistory(driverId: string, limit: number = 50): Promise<Order[]> {
    if (!driverId) {
      throw new BadRequestException('Driver ID is required');
    }
    return this.orderModel.findAll({
      where: {
        driverId: driverId,
        status: {
          [Op.in]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
        },
      } as any,
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
      ],
      order: [['deliveredAt', 'DESC']],
      limit,
    });
  }

  async updateAvailability(driverId: string, dto: UpdateAvailabilityDto): Promise<Driver> {
    if (!driverId) {
      throw new BadRequestException('Driver ID is required');
    }
    const driver = await this.driverModel.findByPk(driverId);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Can't set available if there are active deliveries
    if (dto.isAvailable === true) {
      const activeDeliveries = await this.orderModel.count({
        where: {
          driverId: driverId,
          status: {
            [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
          },
        } as any,
      });

      if (activeDeliveries > 0) {
        throw new BadRequestException('Cannot set available while having active deliveries');
      }
    }

    await driver.update({ isAvailable: dto.isAvailable });

    // 🔔 PUSH NOTIFICATION: Availability changed
    try {
      const company = await this.companyModel.findByPk(driver.companyId);
      if (company?.userId) {
        const status = dto.isAvailable ? 'available' : 'unavailable';
        await this.notificationsService.sendPushNotification(
          company.userId,
          dto.isAvailable ? '✅ Driver Available' : '⏸️ Driver Unavailable',
          `${driver.name} is now ${status}`,
          {
            driverId: driver.id,
            driverName: driver.name,
            isAvailable: dto.isAvailable,
            type: 'driver_availability_changed',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send availability change notification:', error);
    }

    return driver;
  }

  // COMPANY SIDE: invite-based driver marketplace

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
    return users;
  }

  async inviteDriver(companyUserId: string, driverUserId: string, message?: string) {
    console.log('🔧 Backend inviteDriver called:', { companyUserId, driverUserId, message });

    const company = await this.companyModel.findOne({ where: { userId: companyUserId } });
    console.log(
      '🔧 Company found:',
      company ? { id: company.id, userId: company.userId, name: company.companyName } : 'NOT FOUND',
    );

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
      console.log('🔧 Returning existing invitation');
      return existing;
    }

    const invite = await this.invitationModel.create({
      companyId: company.id,
      driverUserId,
      status: 'pending',
      message: message || null,
    } as any);

    console.log('🔧 Invitation created:', {
      id: invite.id,
      companyId: invite.companyId,
      driverUserId: invite.driverUserId,
    });

    // 🔔 PUSH NOTIFICATION: Driver invitation sent
    try {
      await this.notificationsService.sendPushNotification(
        driverUserId,
        '📬 New Company Invitation',
        `${company.companyName} has invited you to join their delivery team`,
        {
          invitationId: invite.id,
          companyId: company.id,
          companyName: company.companyName,
          message: message || '',
          type: 'driver_invitation',
        },
      );

      this.logger.log(`Invitation notification sent to driver ${driverUserId}`);
    } catch (error) {
      this.logger.error('Failed to send invitation notification:', error);
    }

    return invite;
  }

  async getInvitationsForDriver(driverUserId: string) {
    console.log('🔧 Backend getInvitationsForDriver called for userId:', driverUserId);

    if (!driverUserId) {
      throw new BadRequestException('Driver user ID is required');
    }

    const invitations = await this.invitationModel.findAll({
      where: { driverUserId },
      include: [{ model: DeliveryCompany, as: 'company' }],
      order: [['createdAt', 'DESC']],
    });

    console.log('🔧 Found invitations:', invitations.length);
    return invitations;
  }

  async acceptInvitation(driverUserId: string, invitationId: string): Promise<Driver> {
    console.log('🔔 acceptInvitation called:', { driverUserId, invitationId });

    const invite = await this.invitationModel.findByPk(invitationId, {
      include: [{ model: DeliveryCompany, as: 'company' }],
    });

    if (!invite || invite.driverUserId !== driverUserId) {
      throw new NotFoundException('Invitation not found');
    }

    // Mark invite as accepted
    await invite.update({ status: 'accepted' } as any);

    // Look for ANY existing driver record for this user
    let driver = await this.driverModel.findOne({
      where: { userId: driverUserId },
    });

    if (driver) {
      // Update existing driver with the company
      if (driver.companyId !== invite.companyId) {
        await driver.update({
          companyId: invite.companyId,
          isActive: true,
          isAvailable: true,
        });
        console.log('✅ Updated existing driver with companyId:', invite.companyId);
      }
    } else {
      // Create new driver record
      const user = await this.userModel.findByPk(driverUserId);
      const derivedName =
        (user && `${user.firstName || ''} ${user.lastName || ''}`.trim()) ||
        (user && user.email) ||
        'Driver';

      driver = await this.driverModel.create({
        companyId: invite.companyId,
        userId: driverUserId,
        name: derivedName,
        phone: '',
        email: user ? user.email : null,
        isActive: true,
        isAvailable: true,
      } as any);

      console.log('✅ Created new driver record:', driver.id);
    }

    // 🔔 PUSH NOTIFICATION: Invitation accepted
    try {
      const company = await this.companyModel.findByPk(invite.companyId);

      // Notify driver
      await this.notificationsService.sendPushNotification(
        driverUserId,
        '🎉 Welcome to the Team!',
        `You are now a driver for ${company?.companyName || 'the company'}`,
        {
          driverId: driver.id,
          companyId: invite.companyId,
          companyName: company?.companyName,
          type: 'invitation_accepted_driver',
        },
      );

      // Notify company
      if (company?.userId) {
        await this.notificationsService.sendPushNotification(
          company.userId,
          '✅ Driver Accepted Invitation',
          `${driver.name} has accepted your invitation to join ${company.companyName}`,
          {
            driverId: driver.id,
            driverName: driver.name,
            invitationId: invite.id,
            type: 'invitation_accepted_company',
          },
        );
      }

      this.logger.log(`Invitation acceptance notifications sent for driver ${driverUserId}`);
    } catch (error) {
      this.logger.error('Failed to send invitation acceptance notifications:', error);
    }

    return driver;
  }

  async rejectInvitation(driverUserId: string, invitationId: string): Promise<void> {
    const invite = await this.invitationModel.findByPk(invitationId, {
      include: [{ model: DeliveryCompany, as: 'company' }],
    });

    if (!invite || invite.driverUserId !== driverUserId) {
      throw new NotFoundException('Invitation not found');
    }

    await invite.update({ status: 'rejected' } as any);

    // 🔔 PUSH NOTIFICATION: Invitation rejected
    try {
      const company = await this.companyModel.findByPk(invite.companyId);
      const driver = await this.userModel.findByPk(driverUserId);
      const driverName = driver
        ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.email
        : 'Driver';

      // Notify company
      if (company?.userId) {
        await this.notificationsService.sendPushNotification(
          company.userId,
          '❌ Driver Declined Invitation',
          `${driverName} has declined your invitation to join ${company.companyName}`,
          {
            invitationId: invite.id,
            driverUserId,
            type: 'invitation_rejected',
          },
        );
      }

      this.logger.log(`Invitation rejection notification sent to company ${company?.userId}`);
    } catch (error) {
      this.logger.error('Failed to send invitation rejection notification:', error);
    }
  }

  async assignToOrder(dto: AssignDriverDto): Promise<Order> {
    console.log('🚗 assignToOrder called with:', JSON.stringify(dto, null, 2));

    try {
      const [order, driver] = await Promise.all([
        this.orderModel.findByPk(dto.orderId, {
          include: [{ model: User, as: 'buyer' }, { model: DeliveryCompany }],
        }),
        this.driverModel.findByPk(dto.driverId),
      ]);

      console.log('📦 Order found:', order ? `Yes (${order.id})` : 'No');
      console.log('👤 Driver found:', driver ? `Yes (${driver.id} - ${driver.name})` : 'No');

      if (!order) {
        console.error('❌ Order not found:', dto.orderId);
        throw new NotFoundException('Order not found');
      }

      if (!driver) {
        console.error('❌ Driver not found:', dto.driverId);
        throw new NotFoundException('Driver not found');
      }

      console.log('🏢 Order company:', order.deliveryCompanyId);
      console.log('🏢 Driver company:', driver.companyId);
      console.log('✅ Driver active:', driver.isActive);
      console.log('✅ Driver available:', driver.isAvailable);

      if (order.deliveryCompanyId !== driver.companyId) {
        console.error(
          '❌ Company mismatch - Order:',
          order.deliveryCompanyId,
          'Driver:',
          driver.companyId,
        );
        throw new ForbiddenException('Driver does not belong to assigned company');
      }

      if (!driver.isActive || !driver.isAvailable) {
        console.error(
          '❌ Driver not available - Active:',
          driver.isActive,
          'Available:',
          driver.isAvailable,
        );
        throw new BadRequestException('Driver is not available for assignment');
      }

      console.log('🔄 Updating order...');
      await order.update({
        driverId: driver.id,
        status: OrderStatus.ASSIGNED,
        assignedAt: new Date(),
        trackingHistory: [
          ...(order.trackingHistory || []),
          {
            status: OrderStatus.ASSIGNED,
            timestamp: new Date(),
            remarks: `Assigned to driver: ${driver.name}`,
          },
        ],
      } as any);

      console.log('✅ Order updated successfully');

      // 🔔 PUSH NOTIFICATION: Driver assigned to order
      try {
        // Notify driver
        if (driver.userId) {
          await this.notificationsService.sendPushNotification(
            driver.userId,
            '📦 New Delivery Assignment',
            `You have been assigned order #${order.id}`,
            {
              orderId: order.id,
              orderNumber: order.id,
              pickupAddress: order.deliveryAddress,
              deliveryAddress: order.deliveryAddress,
              type: 'driver_assigned_order',
            },
          );
        }

        // Notify buyer
        await this.notificationsService.sendPushNotification(
          order.buyerId,
          '🚗 Driver Assigned to Your Order',
          `${driver.name} will be delivering your order #${order.id}`,
          {
            orderId: order.id,
            orderNumber: order.id,
            driverId: driver.id,
            driverName: driver.name,
            type: 'order_driver_assigned',
          },
        );

        // Notify company
        const company = await this.companyModel.findByPk(driver.companyId);
        if (company?.userId) {
          await this.notificationsService.sendPushNotification(
            company.userId,
            '✅ Driver Assigned to Order',
            `${driver.name} has been assigned to order #${order.id}`,
            {
              orderId: order.id,
              driverId: driver.id,
              driverName: driver.name,
              type: 'company_driver_assigned',
            },
          );
        }

        this.logger.log(
          `Assignment notifications sent for order ${order.id} and driver ${driver.id}`,
        );
      } catch (error) {
        this.logger.error('Failed to send assignment notifications:', error);
      }

      console.log('✅ Order assigned successfully to driver:', driver.name);
      return order;
    } catch (error) {
      console.error('❌ assignToOrder error:', error);
      throw error;
    }
  }

  async getDriverStats(driverId: string): Promise<any> {
    if (!driverId) {
      throw new BadRequestException('Driver ID is required');
    }

    const [totalDeliveries, completedDeliveries, failedDeliveries, pendingDeliveries, driver] =
      await Promise.all([
        this.orderModel.count({ where: { driverId: driverId } as any }),
        this.orderModel.count({
          where: { driverId: driverId, status: OrderStatus.DELIVERED } as any,
        }),
        this.orderModel.count({
          where: { driverId: driverId, status: OrderStatus.FAILED } as any,
        }),
        this.orderModel.count({
          where: {
            driverId: driverId,
            status: {
              [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
            },
          } as any,
        }),
        this.driverModel.findByPk(driverId),
      ]);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const successRate =
      totalDeliveries > 0 ? ((completedDeliveries / totalDeliveries) * 100).toFixed(2) : '0';

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

  // New method: Driver applies to a company
  async applyToCompany(
    driverUserId: string,
    companyId: string,
    message?: string,
  ): Promise<DriverInvitation> {
    // Check if driver already has a pending or accepted application to this company
    const existing = await this.invitationModel.findOne({
      where: {
        driverUserId,
        companyId,
        status: {
          [Op.in]: ['pending', 'accepted'],
        },
      },
    });

    if (existing) {
      if (existing.status === 'accepted') {
        throw new BadRequestException('You are already a driver for this company');
      }
      throw new BadRequestException('You already have a pending application to this company');
    }

    // Create application (invitation initiated by driver)
    const application = await this.invitationModel.create({
      companyId,
      driverUserId,
      status: 'pending',
      message: message || 'Driver application to join your company',
    } as any);

    // Notify company about new application
    try {
      const company = await this.companyModel.findByPk(companyId);
      const driver = await this.userModel.findByPk(driverUserId);

      if (company?.userId && driver) {
        // Send push notification
        await this.notificationsService.sendPushNotification(
          company.userId,
          '🚗 New Driver Application',
          `${driver.firstName || driver.email} applied to join your company`,
          {
            applicationId: application.id,
            driverUserId,
            driverName: driver.firstName || driver.email,
            companyId,
            type: 'driver_application',
          },
        );

        // Create in-app notification
        await this.notificationsService.create(
          {
            title: '🚗 New Driver Application',
            message: `${driver.firstName || driver.email} wants to join ${company.companyName}. Review their application now.`,
            type: 'driver',
            actionUrl: `/driver-applications`,
            data: {
              applicationId: application.id,
              driverUserId,
              driverName:
                `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.email,
              companyId,
            },
          },
          company.userId,
        );

        this.logger.log(`✅ Sent application notification to company ${company.userId}`);
      }
    } catch (error) {
      this.logger.error('Failed to send application notification:', error);
    }

    return application;
  }

  // Get driver's own applications
  async getMyApplications(driverUserId: string): Promise<DriverInvitation[]> {
    return this.invitationModel.findAll({
      where: { driverUserId },
      include: [
        {
          model: DeliveryCompany,
          as: 'company',
          include: [{ model: User, as: 'user' }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}
