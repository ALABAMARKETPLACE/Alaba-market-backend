// // src/modules/orders/orders.service.ts
// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
//   ForbiddenException,
//   Logger,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/sequelize';
// import { Op } from 'sequelize';
// import { MailerService } from '@nestjs-modules/mailer';
// import { Order } from './entities/order-entity';
// import { Product } from '../products/entities/products-entity';
// import { DeliveryCompany } from '../delivery/entities/delivery-compnay-entity';
// import { User } from '../users/entities/user-entity';
// import { Driver } from '../drivers/entities/driver.entity';
// import { CreateOrderDto } from './dto/create-order.dto';
// import { OrderStatus } from '../../enums/order-status';
// import { PaymentStatus } from '../../enums/payment-status-enums';
// import * as crypto from 'crypto';
// import { NotificationsService } from '../notifications/notifications.service';

// @Injectable()
// export class OrdersService {
//   private readonly logger = new Logger(OrdersService.name);
//   constructor(
//     @InjectModel(Order)
//     private orderModel: typeof Order,
//     private notificationsService: NotificationsService,
//     @InjectModel(Product)
//     private productModel: typeof Product,
//     @InjectModel(DeliveryCompany)
//     private deliveryCompanyModel: typeof DeliveryCompany,
//     @InjectModel(User)
//     private userModel: typeof User,
//     @InjectModel(Driver)
//     private driverModel: typeof Driver,
//     private mailerService: MailerService,
//   ) {}

//   async create(createOrderDto: CreateOrderDto, buyerId: string) {
//     const isDev = process.env.NODE_ENV !== 'production';

//     const product = await this.productModel.findByPk(createOrderDto.productId, {
//       include: [{ model: User, as: 'seller' }],
//     });

//     if (!product) {
//       throw new NotFoundException('Product not found');
//     }

//     if (product.stock < createOrderDto.quantity) {
//       throw new BadRequestException('Insufficient stock');
//     }

//     // Initially do NOT assign a delivery company.
//     // Orders start unassigned and any company can later "accept" them.
//     let deliveryCompanyId = createOrderDto.deliveryCompanyId || null;

//     const unitPrice = product.price;
//     const totalPrice = unitPrice * createOrderDto.quantity;

//     // Generate secure codes
//     const barcodeShortCode = this.generateShortBarcode();
//     const deliveryCode = this.generateDeliveryCode();

//     const order = await this.orderModel.create({
//       buyerId,
//       sellerId: product.sellerId,
//       productId: product.id,
//       deliveryCompanyId,
//       quantity: createOrderDto.quantity,
//       unitPrice,
//       totalPrice,
//       deliveryAddress: createOrderDto.deliveryAddress,
//       deliveryCity: createOrderDto.deliveryCity,
//       deliveryState: createOrderDto.deliveryState,
//       selectedRoute: createOrderDto.selectedRoute,
//       barcodeShortCode,
//       deliveryCode,
//       status: OrderStatus.PENDING,
//       paymentStatus: PaymentStatus.PENDING,
//       trackingHistory: [
//         {
//           status: OrderStatus.PENDING,
//           timestamp: new Date(),
//           remarks: 'Order created',
//         },
//       ],

//     } as any);

//     // In development, skip sending emails to avoid slow/failed SMTP blocking order creation
//     if (isDev) {
//       return order;
//     }

//     // Send codes asynchronously (fire-and-forget to avoid blocking response)
//     this.sendOrderCodes(order).catch((error) => {
//       // Log and continue; email delivery failure should not prevent order creation
//       console.error('Failed to send order emails:', error?.message || error);
//     });

//     return order;
//   }

//   /**
//    * Map internal Order model to frontend-friendly shape.
//    * Frontend expects: totalAmount, packageBarcode, paymentReference, items[], etc.
//    */
//   mapOrderForFrontend(order: Order & { product?: Product }): any {
//     return {
//       id: order.id,
//       buyerId: order.buyerId,
//       totalAmount: Number(order.totalPrice),
//       status: order.status,
//       deliveryAddress: order.deliveryAddress,
//       deliveryCode: order.deliveryCode,
//       packageBarcode: order.barcodeShortCode,
//       paymentReference: order.paystackReference,
//       createdAt: order.createdAt,
//       updatedAt: order.updatedAt,
//       // Expose driver info for company/driver tracking UIs
//       driverId: (order as any).driverId,
//       driver: (order as any).driver
//         ? {
//             id: (order as any).driver.id,
//             name: (order as any).driver.name,
//             email: (order as any).driver.email,
//             phone: (order as any).driver.phone,
//           }
//         : null,
//       // For now single-product order → one item
//       items: [
//         {
//           id: `${order.id}-item`,
//           orderId: order.id,
//           productId: order.productId,
//           quantity: order.quantity,
//           price: Number(order.unitPrice),
//           product: order.product || null,
//         },
//       ],
//     };
//   }

//   mapOrdersForFrontend(orders: Array<Order & { product?: Product }>): any[] {
//     return orders.map((o) => this.mapOrderForFrontend(o));
//   }

//   async confirmPackageReceived(
//     orderId: string,
//     barcodeShortCode: string,
//     packagePhoto: string,
//     userId: string,
//   ) {
//     console.log('📦 confirmPackageReceived called:', { orderId, userId, barcodeShortCode });

//     const order = await this.orderModel.findByPk(orderId, {
//       include: [
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//         { model: DeliveryCompany },
//       ],
//     });

//     if (!order) {
//       throw new NotFoundException('Order not found');
//     }

//     console.log('📦 Order found:', {
//       status: order.status,
//       deliveryCompanyId: order.deliveryCompanyId,
//       driverId: order.driverId,
//     });

//     // Check if user is a driver or company admin
//     const driver = await this.driverModel.findOne({ where: { userId } });
//     const company = await this.deliveryCompanyModel.findOne({ where: { userId } });

//     console.log('📦 User authorization check:', {
//       hasDriverProfile: !!driver,
//       hasCompanyProfile: !!company,
//       driverDetails: driver ? { id: driver.id, companyId: driver.companyId } : null,
//     });

//     if (!driver && !company) {
//       console.log('❌ Authorization failed: No driver or company profile');
//       throw new ForbiddenException(
//         'User must be a driver or company admin to confirm package receipt',
//       );
//     }

//     if (!order.deliveryCompanyId) {
//       console.log('❌ Authorization failed: Order not assigned to any company');
//       throw new ForbiddenException('This order has not been assigned to any delivery company yet');
//     }

//     // Validate authorization
//     if (driver) {
//       console.log('📦 Driver authorization check:', {
//         orderDriverId: order.driverId,
//         userDriverId: driver.id,
//         orderCompanyId: order.deliveryCompanyId,
//         driverCompanyId: driver.companyId,
//       });

//       // Driver must be assigned to this order
//       if (order.driverId !== driver.id) {
//         console.log('❌ Authorization failed: Order not assigned to this driver');
//         throw new ForbiddenException('This order is not assigned to you');
//       }

//       // If driver's companyId is null but they're assigned to this order,
//       // update their companyId to match the order's delivery company
//       if (!driver.companyId && order.deliveryCompanyId) {
//         console.log(
//           '🔧 Fixing driver companyId mismatch - updating from null to:',
//           order.deliveryCompanyId,
//         );
//         await driver.update({ companyId: order.deliveryCompanyId });
//         console.log('✅ Driver companyId updated successfully');
//       } else if (driver.companyId && order.deliveryCompanyId !== driver.companyId) {
//         // Driver's company must match order's company (only check if companyId is set)
//         console.log('❌ Authorization failed: Company mismatch');
//         throw new ForbiddenException('This order is not assigned to your company');
//       }
//       console.log('✅ Driver authorization passed');
//     } else if (company) {
//       console.log('📦 Company authorization check:', {
//         orderCompanyId: order.deliveryCompanyId,
//         userCompanyId: company.id,
//       });
//       // Company admin must own the delivery company
//       if (order.deliveryCompanyId !== company.id) {
//         console.log('❌ Authorization failed: Company mismatch');
//         throw new ForbiddenException('This order is not assigned to your company');
//       }
//       console.log('✅ Company authorization passed');
//     }

//     if (order.barcodeShortCode !== barcodeShortCode) {
//       console.log('❌ Barcode mismatch:', {
//         expected: order.barcodeShortCode,
//         received: barcodeShortCode,
//       });
//       throw new BadRequestException('Invalid barcode');
//     }

//     console.log('✅ Barcode validated successfully');

//     await order.update({
//       status: OrderStatus.PACKAGE_RECEIVED,
//       trackingHistory: [
//         ...order.trackingHistory,
//         {
//           status: OrderStatus.PACKAGE_RECEIVED,
//           timestamp: new Date(),
//           remarks: `Package received at delivery company. Photo: ${packagePhoto}`,
//         },
//       ],
//     });

//     // Send emails asynchronously (fire-and-forget to avoid blocking response)
//     const isDev = process.env.NODE_ENV !== 'production';
//     if (!isDev) {
//       // Don't await - send emails in background
//       (async () => {
//         try {
//           // Fetch driver information if assigned
//           let driverName = 'Delivery Driver';
//           if (order.driverId && driver) {
//             driverName = driver.name || 'Delivery Driver';
//           }

//           // Get company name
//           const companyName = order.deliveryCompany?.companyName || 'Delivery Company';

//           await this.mailerService.sendMail({
//             to: order.buyer.email,
//             subject: 'Package Received by Delivery Company',
//             template: 'package-received',
//             context: {
//               orderNumber: order.id,
//               buyerName: order.buyer.firstName || order.buyer.email,
//               driverName: driverName,
//               companyName: companyName,
//               deliveryAddress: order.deliveryAddress || 'Your specified address',
//               trackingLink: `${process.env.FRONTEND_URL}/tracking/${order.id}`,
//             },
//           });
//         } catch (error) {
//           console.error('Failed to send package received email:', error?.message || error);
//         }
//       })();
//     }

//     return order;
//   }

//   async confirmDelivery(
//     orderId: string,
//     deliveryCode: string,
//     deliveryPhoto: string | undefined,
//     geolocation: { latitude: number; longitude: number } | undefined,
//     userId: string,
//     userRole: string,
//   ) {
//     const order = await this.orderModel.findByPk(orderId, {
//       include: [
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//         { model: DeliveryCompany },
//       ],
//     });

//     if (!order) {
//       throw new NotFoundException('Order not found');
//     }

//     // Role-based ownership checks
//     if (userRole === 'driver') {
//       // For now, allow any authenticated driver to confirm delivery
//       // as long as the order has been assigned to some delivery company
//       if (!order.deliveryCompanyId) {
//         throw new ForbiddenException(
//           'This order has not been assigned to any delivery company yet',
//         );
//       }
//     } else if (userRole === 'company') {
//       const company = await this.deliveryCompanyModel.findOne({ where: { userId } });
//       if (!company) {
//         throw new ForbiddenException('Delivery company profile not found for this user');
//       }
//       if (order.deliveryCompanyId !== company.id) {
//         throw new ForbiddenException('This order is not assigned to your company');
//       }
//     } else if (userRole === 'buyer') {
//       if (order.buyerId !== userId) {
//         throw new ForbiddenException('This order does not belong to you');
//       }
//     }

//     const safeGeo = geolocation || { latitude: 0, longitude: 0 };
//     const safePhoto = deliveryPhoto || 'Delivered (no photo provided)';

//     // CRITICAL: Verify delivery code
//     if (order.deliveryCode !== deliveryCode) {
//       // BLOCK DELIVERY - Send alerts
//       await order.update({
//         status: OrderStatus.FAILED,
//         trackingHistory: [
//           ...order.trackingHistory,
//           {
//             status: OrderStatus.FAILED,
//             timestamp: new Date(),
//             remarks: `DELIVERY BLOCKED: Wrong delivery code entered. Location: ${JSON.stringify(
//               safeGeo,
//             )}`,
//           },
//         ],
//       });

//       // In production, send alert emails to admin, seller, buyer
//       const isDev = process.env.NODE_ENV !== 'production';
//       if (!isDev) {
//         try {
//           await this.sendFailedDeliveryAlerts(order, deliveryCode, safeGeo);
//         } catch (error) {
//           console.error('Failed to send failed delivery alerts:', error?.message || error);
//         }
//       }

//       throw new BadRequestException(
//         'Invalid delivery code. Delivery blocked. Admin has been notified.',
//       );
//     }

//     // SUCCESS - Complete delivery
//     await order.update({
//       status: OrderStatus.DELIVERED,
//       deliveredAt: new Date(),
//       trackingHistory: [
//         ...order.trackingHistory,
//         {
//           status: OrderStatus.DELIVERED,
//           timestamp: new Date(),
//           remarks: `Delivered successfully. Photo: ${safePhoto}. Location: ${JSON.stringify(
//             safeGeo,
//           )}`,
//         },
//       ],
//     });

//     // Send notifications asynchronously (fire-and-forget to avoid blocking response)
//     const isDev = process.env.NODE_ENV !== 'production';
//     if (!isDev) {
//       // Don't await - send emails in background
//       this.sendDeliverySuccessNotifications(order).catch((error) => {
//         console.error('Failed to send delivery success notifications:', error?.message || error);
//       });
//     }

//     return order;
//   }

//   async getOrdersByUser(userId: string, role: string) {
//     const where: any = {};

//     if (role === 'buyer') {
//       where.buyerId = userId;
//     } else if (role === 'seller') {
//       where.sellerId = userId;
//     } else if (role === 'company') {
//       where.deliveryCompanyId = userId;
//     } else if (role === 'driver') {
//       where.driverId = userId;
//     }

//     return this.orderModel.findAll({
//       where,
//       include: [
//         { model: Product },
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//         { model: DeliveryCompany },
//         { model: Driver },
//       ],
//       order: [['createdAt', 'DESC']],
//     });
//   }

//   async getOrderById(orderId: string) {
//     const order = await this.orderModel.findByPk(orderId, {
//       include: [
//         { model: Product },
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//         { model: DeliveryCompany },
//         { model: Driver },
//       ],
//     });

//     if (!order) {
//       throw new NotFoundException('Order not found');
//     }

//     return order;
//   }

//   async getUnassignedOrders() {
//     const orders = await this.orderModel.findAll({
//       where: {
//         deliveryCompanyId: null,
//         status: { [Op.in]: ['pending', 'payment_confirmed'] },
//       },
//       include: [
//         { model: Product },
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//         { model: DeliveryCompany },
//         { model: Driver },
//       ],
//       order: [['createdAt', 'DESC']],
//     });

//     return orders;
//   }

//   /**
//    * Update order status to PAYMENT_CONFIRMED after successful payment
//    * Notifies delivery company about new order ready for pickup
//    */
//   async confirmPayment(orderId: string) {
//     const order = await this.orderModel.findByPk(orderId, {
//       include: [
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//         { model: Product },
//         { model: DeliveryCompany },
//       ],
//     });

//     if (!order) {
//       throw new NotFoundException('Order not found');
//     }

//     if (order.status !== OrderStatus.PENDING) {
//       throw new BadRequestException('Order payment already confirmed or processed');
//     }

//     await order.update({
//       status: OrderStatus.PAYMENT_CONFIRMED,
//       paymentStatus: PaymentStatus.SUCCESS,
//       trackingHistory: [
//         ...order.trackingHistory,
//         {
//           status: OrderStatus.PAYMENT_CONFIRMED,
//           timestamp: new Date(),
//           remarks: 'Payment confirmed successfully',
//         },
//       ],
//     });

//     // Send notifications to buyer, seller, and delivery company
//     const isDev = process.env.NODE_ENV !== 'production';
//     if (!isDev) {
//       // Don't await - send emails in background
//       this.sendPaymentConfirmedNotifications(order).catch((error) => {
//         console.error('Failed to send payment confirmed notifications:', error?.message || error);
//       });
//     }

//     return order;
//   }

//   /**
//    * Driver marks order as picked up from warehouse
//    * Notifies buyer and seller
//    */
//   async markAsPickedUp(orderId: string, userId: string, userRole: string) {
//     const order = await this.orderModel.findByPk(orderId, {
//       include: [
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//         { model: DeliveryCompany },
//         { model: Driver },
//       ],
//     });

//     if (!order) {
//       throw new NotFoundException('Order not found');
//     }

//     // Verify authorization
//     if (userRole === 'driver') {
//       if (!order.driverId) {
//         throw new ForbiddenException('This order has not been assigned to any driver yet');
//       }
//     } else if (userRole === 'company') {
//       const company = await this.deliveryCompanyModel.findOne({ where: { userId } });
//       if (!company || order.deliveryCompanyId !== company.id) {
//         throw new ForbiddenException('This order is not assigned to your company');
//       }
//     } else {
//       throw new ForbiddenException('Only drivers or delivery companies can update pickup status');
//     }

//     await order.update({
//       status: OrderStatus.PICKED_UP,
//       trackingHistory: [
//         ...order.trackingHistory,
//         {
//           status: OrderStatus.PICKED_UP,
//           timestamp: new Date(),
//           remarks: 'Package picked up from warehouse',
//         },
//       ],
//     });

//     // Send notifications
//     const isDev = process.env.NODE_ENV !== 'production';
//     if (!isDev) {
//       // Don't await - send emails in background
//       this.sendPickedUpNotifications(order).catch((error) => {
//         console.error('Failed to send picked up notifications:', error?.message || error);
//       });
//     }

//     return order;
//   }

//   /**
//    * Driver marks order as out for delivery
//    * Notifies buyer and seller with estimated delivery time
//    */
//   async markAsOutForDelivery(orderId: string, userId: string, userRole: string) {
//     const order = await this.orderModel.findByPk(orderId, {
//       include: [
//         { model: User, as: 'buyer' },
//         { model: User, as: 'seller' },
//         { model: DeliveryCompany },
//         { model: Driver },
//       ],
//     });

//     if (!order) {
//       throw new NotFoundException('Order not found');
//     }

//     // Verify authorization
//     if (userRole === 'driver') {
//       if (!order.driverId) {
//         throw new ForbiddenException('This order has not been assigned to any driver yet');
//       }
//     } else if (userRole === 'company') {
//       const company = await this.deliveryCompanyModel.findOne({ where: { userId } });
//       if (!company || order.deliveryCompanyId !== company.id) {
//         throw new ForbiddenException('This order is not assigned to your company');
//       }
//     } else {
//       throw new ForbiddenException('Only drivers or delivery companies can update delivery status');
//     }

//     await order.update({
//       status: OrderStatus.OUT_FOR_DELIVERY,
//       trackingHistory: [
//         ...order.trackingHistory,
//         {
//           status: OrderStatus.OUT_FOR_DELIVERY,
//           timestamp: new Date(),
//           remarks: 'Package is out for delivery',
//         },
//       ],
//     });

//     // Send notifications asynchronously (fire-and-forget to avoid blocking response)
//     const isDev = process.env.NODE_ENV !== 'production';
//     if (!isDev) {
//       // Don't await - send emails in background
//       this.sendOutForDeliveryNotifications(order).catch((error) => {
//         console.error('Failed to send out for delivery notifications:', error?.message || error);
//       });
//     }

//     return order;
//   }

//   // Helper methods
//   private async findDeliveryCompaniesForLocation(city: string, state: string) {
//     return this.deliveryCompanyModel.findAll({
//       where: {
//         isActive: true,
//         subscriptionStatus: 'active',
//       },
//     });
//     // TODO: Filter by routes that match city/state
//   }

//   private generateShortBarcode(): string {
//     return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 characters
//   }

//   private generateDeliveryCode(): string {
//     return crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 characters
//   }

//   private async sendOrderCodes(order: Order) {
//     // Fetch buyer and seller records to ensure we have valid email addresses
//     const [buyer, seller] = await Promise.all([
//       this.userModel.findByPk(order.buyerId),
//       this.userModel.findByPk(order.sellerId),
//     ]);

//     if (!buyer) {
//       throw new NotFoundException('Buyer not found for this order');
//     }

//     if (!seller) {
//       throw new NotFoundException('Seller not found for this order');
//     }

//     // Send to buyer
//     await this.mailerService.sendMail({
//       to: buyer.email,
//       subject: 'Your Order Confirmation & Delivery Code',
//       html: `
//         <h2>Order Confirmed</h2>
//         <p>Order Number: ${order.id}</p>
//         <p><strong>Barcode (for package): ${order.barcodeShortCode}</strong></p>
//         <p><strong>Delivery Code (KEEP SECRET): ${order.deliveryCode}</strong></p>
//         <p>The driver will need this code to complete delivery.</p>
//       `,
//     });

//     // Send to seller
//     await this.mailerService.sendMail({
//       to: seller.email,
//       subject: 'New Order - Package Barcode',
//       html: `
//         <h2>New Order Received</h2>
//         <p>Order Number: ${order.id}</p>
//         <p><strong>Barcode to write on package: ${order.barcodeShortCode}</strong></p>
//         <p><strong>Delivery Code: ${order.deliveryCode}</strong></p>
//       `,
//     });
//   }

//   private async sendFailedDeliveryAlerts(order: Order, wrongCode: string, geolocation: any) {
//     const alertEmail = {
//       subject: '🚨 ALERT: Failed Delivery Attempt - Wrong Code',
//       html: `
//         <h2>DELIVERY BLOCKED</h2>
//         <p>Order: ${order.id}</p>
//         <p>Wrong code entered: ${wrongCode}</p>
//         <p>Correct code: ${order.deliveryCode}</p>
//         <p>Location: ${JSON.stringify(geolocation)}</p>
//         <p>Time: ${new Date().toISOString()}</p>
//       `,
//     };

//     // Send to admin
//     try {
//       await this.mailerService.sendMail({
//         to: process.env.ADMIN_EMAIL || 'admin@alabamarketplace.com',
//         ...alertEmail,
//       });
//     } catch (error) {
//       console.error('Failed to send alert to admin:', error?.message || error);
//     }

//     // Send to buyer
//     try {
//       await this.mailerService.sendMail({
//         to: order.buyer.email,
//         ...alertEmail,
//       });
//     } catch (error) {
//       console.error('Failed to send alert to buyer:', error?.message || error);
//     }

//     // Send to seller
//     try {
//       await this.mailerService.sendMail({
//         to: order.seller.email,
//         ...alertEmail,
//       });
//     } catch (error) {
//       console.error('Failed to send alert to seller:', error?.message || error);
//     }
//   }

//   private async sendPaymentConfirmedNotifications(
//     order: Order & {
//       buyer?: User;
//       seller?: User;
//       deliveryCompany?: DeliveryCompany;
//     },
//   ) {
//     const trackingLink = `${process.env.FRONTEND_URL || 'https://alabamarketplace.com'}/tracking/${order.id}`;

//     // Notify buyer
//     if (order.buyer?.email) {
//       await this.mailerService.sendMail({
//         to: order.buyer.email,
//         subject: '✅ Payment Confirmed - Order Processing',
//         html: `
//           <h2>Payment Confirmed</h2>
//           <p>Hello ${order.buyer.firstName || 'Customer'},</p>
//           <p>Your payment for order <strong>#${order.id}</strong> has been confirmed.</p>
//           <p>Your order is now being processed and will be assigned to a delivery company soon.</p>
//           <p><a href="${trackingLink}">Track your order</a></p>
//         `,
//       });
//     }

//     // Notify seller
//     if (order.seller?.email) {
//       await this.mailerService.sendMail({
//         to: order.seller.email,
//         subject: '💰 Payment Received - Prepare Package',
//         html: `
//           <h2>Payment Received</h2>
//           <p>Hello ${order.seller.firstName || 'Seller'},</p>
//           <p>Payment confirmed for order <strong>#${order.id}</strong>.</p>
//           <p><strong>Barcode: ${order.barcodeShortCode}</strong></p>
//           <p>Please prepare the package for pickup by the delivery company.</p>
//           <p><a href="${trackingLink}">View order details</a></p>
//         `,
//       });
//     }

//     // Notify delivery company if already assigned
//     if (order.deliveryCompany?.userId) {
//       const companyUser = await this.userModel.findByPk(order.deliveryCompany.userId);
//       if (companyUser?.email) {
//         await this.mailerService.sendMail({
//           to: companyUser.email,
//           subject: '📦 New Order Ready for Pickup',
//           html: `
//             <h2>New Order Ready</h2>
//             <p>Order <strong>#${order.id}</strong> is ready for pickup.</p>
//             <p><strong>Barcode: ${order.barcodeShortCode}</strong></p>
//             <p>Pickup Address: ${order.deliveryAddress}, ${order.deliveryCity}</p>
//             <p><a href="${trackingLink}">View order details</a></p>
//           `,
//         });
//       }
//     }
//   }

//   private async sendPickedUpNotifications(
//     order: Order & {
//       buyer?: User;
//       seller?: User;
//       deliveryCompany?: DeliveryCompany;
//     },
//   ) {
//     const trackingLink = `${process.env.FRONTEND_URL || 'https://alabamarketplace.com'}/tracking/${order.id}`;
//     const companyName = order.deliveryCompany?.companyName || 'Delivery Company';

//     // Notify buyer
//     if (order.buyer?.email) {
//       try {
//         await this.mailerService.sendMail({
//           to: order.buyer.email,
//           subject: '📦 Package Picked Up - On The Way',
//           html: `
//             <h2>Package Picked Up</h2>
//             <p>Hello ${order.buyer.firstName || 'Customer'},</p>
//             <p>Your order <strong>#${order.id}</strong> has been picked up by ${companyName}.</p>
//             <p>It will be delivered to: ${order.deliveryAddress}</p>
//             <p><a href="${trackingLink}">Track your delivery</a></p>
//           `,
//         });
//       } catch (error) {
//         console.error('Failed to send buyer email:', error?.message || error);
//       }
//     }

//     // Notify seller
//     if (order.seller?.email) {
//       try {
//         await this.mailerService.sendMail({
//           to: order.seller.email,
//           subject: '✅ Package Picked Up by Delivery Company',
//           html: `
//             <h2>Package Picked Up</h2>
//             <p>Hello ${order.seller.firstName || 'Seller'},</p>
//             <p>Your package for order <strong>#${order.id}</strong> has been picked up by ${companyName}.</p>
//             <p><a href="${trackingLink}">Track delivery status</a></p>
//           `,
//         });
//       } catch (error) {
//         console.error('Failed to send seller email:', error?.message || error);
//       }
//     }
//   }

//   private async sendOutForDeliveryNotifications(
//     order: Order & {
//       buyer?: User;
//       seller?: User;
//       deliveryCompany?: DeliveryCompany;
//       driver?: Driver;
//     },
//   ) {
//     const trackingLink = `${process.env.FRONTEND_URL || 'https://alabamarketplace.com'}/tracking/${order.id}`;
//     const companyName = order.deliveryCompany?.companyName || 'Delivery Company';
//     const driverName = order.driver?.name || 'Driver';

//     // Notify buyer - most important
//     if (order.buyer?.email) {
//       try {
//         await this.mailerService.sendMail({
//           to: order.buyer.email,
//           subject: '🚚 Your Package Is Out For Delivery!',
//           html: `
//             <h2>Out For Delivery</h2>
//             <p>Hello ${order.buyer.firstName || 'Customer'},</p>
//             <p>Great news! Your order <strong>#${order.id}</strong> is out for delivery.</p>
//             <p><strong>Driver:</strong> ${driverName}</p>
//             <p><strong>Delivery Address:</strong> ${order.deliveryAddress}, ${order.deliveryCity}</p>
//             <p>Your delivery code is: <strong>${order.deliveryCode}</strong></p>
//             <p><em>Keep this code safe - the driver will need it to complete delivery.</em></p>
//             <p><a href="${trackingLink}">Track in real-time</a></p>
//           `,
//         });
//       } catch (error) {
//         console.error('Failed to send buyer email:', error?.message || error);
//       }
//     }

//     // Notify seller
//     if (order.seller?.email) {
//       try {
//         await this.mailerService.sendMail({
//           to: order.seller.email,
//           subject: '🚚 Package Out For Delivery',
//           html: `
//             <h2>Out For Delivery</h2>
//             <p>Hello ${order.seller.firstName || 'Seller'},</p>
//             <p>Order <strong>#${order.id}</strong> is now out for delivery by ${companyName}.</p>
//             <p><a href="${trackingLink}">Track delivery</a></p>
//           `,
//         });
//       } catch (error) {
//         console.error('Failed to send seller email:', error?.message || error);
//       }
//     }

//     // Notify delivery company
//     if (order.deliveryCompany?.userId) {
//       try {
//         const companyUser = await this.userModel.findByPk(order.deliveryCompany.userId);
//         if (companyUser?.email) {
//           await this.mailerService.sendMail({
//             to: companyUser.email,
//             subject: '🚚 Driver Out For Delivery',
//             html: `
//               <h2>Delivery In Progress</h2>
//               <p>Order <strong>#${order.id}</strong> is out for delivery.</p>
//               <p><strong>Driver:</strong> ${driverName}</p>
//             <p><strong>Delivery Address:</strong> ${order.deliveryAddress}</p>
//             <p><a href="${trackingLink}">Monitor delivery</a></p>
//           `,
//           });
//         }
//       } catch (error) {
//         console.error('Failed to send company email:', error?.message || error);
//       }
//     }
//   }

//   private async sendDeliverySuccessNotifications(
//     order: Order & {
//       buyer?: User;
//       seller?: User;
//       deliveryCompany?: DeliveryCompany;
//     },
//   ) {
//     const trackingLink = `${process.env.FRONTEND_URL || 'https://alabamarketplace.com'}/tracking/${order.id}`;
//     const deliveryDate = new Date(order.deliveredAt).toLocaleString();
//     const companyName = order.deliveryCompany?.companyName || 'Delivery Company';

//     // Send to buyer
//     if (order.buyer?.email) {
//       try {
//         await this.mailerService.sendMail({
//           to: order.buyer.email,
//           subject: '✅ Your Order Has Been Delivered Successfully!',
//           template: 'order-delivered',
//           context: {
//             buyerName: order.buyer.firstName || 'Valued Customer',
//             orderNumber: order.id,
//             companyName,
//             trackingLink,
//             deliveryDate,
//             isBuyer: true,
//             isSeller: false,
//             isCompany: false,
//           },
//         });
//       } catch (error) {
//         console.error('Failed to send buyer delivery email:', error?.message || error);
//       }
//     }

//     // Send to seller
//     if (order.seller?.email) {
//       try {
//         await this.mailerService.sendMail({
//           to: order.seller.email,
//           subject: '✅ Order Delivered - Payment Ready',
//           template: 'order-delivered',
//           context: {
//             sellerName: order.seller.firstName || 'Seller',
//             orderNumber: order.id,
//             companyName,
//             trackingLink,
//             deliveryDate,
//             isBuyer: false,
//             isSeller: true,
//             isCompany: false,
//           },
//         });
//       } catch (error) {
//         console.error('Failed to send seller delivery email:', error?.message || error);
//       }
//     }

//     // Send to delivery company
//     if (order.deliveryCompany?.userId) {
//       try {
//         const companyUser = await this.userModel.findByPk(order.deliveryCompany.userId);
//         if (companyUser?.email) {
//           await this.mailerService.sendMail({
//             to: companyUser.email,
//             subject: '✅ Order Delivery Completed',
//             template: 'order-delivered',
//             context: {
//               companyName,
//               orderNumber: order.id,
//               trackingLink,
//               deliveryDate,
//               isBuyer: false,
//               isSeller: false,
//               isCompany: true,
//             },
//           });
//         }
//       } catch (error) {
//         console.error('Failed to send company delivery email:', error?.message || error);
//       }
//     }
//   }
// }

// src/modules/orders/orders.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { MailerService } from '@nestjs-modules/mailer';
import { Order } from './entities/order-entity';
import { Product } from '../products/entities/products-entity';
import { DeliveryCompany } from '../delivery/entities/delivery-compnay-entity';
import { User } from '../users/entities/user-entity';
import { Driver } from '../drivers/entities/driver.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '../../enums/order-status';
import { PaymentStatus } from '../../enums/payment-status-enums';
import * as crypto from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectModel(Order)
    private orderModel: typeof Order,
    private notificationsService: NotificationsService,
    @InjectModel(Product)
    private productModel: typeof Product,
    @InjectModel(DeliveryCompany)
    private deliveryCompanyModel: typeof DeliveryCompany,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Driver)
    private driverModel: typeof Driver,
    private mailerService: MailerService,
  ) {}

  async create(createOrderDto: CreateOrderDto, buyerId: string) {
    const isDev = process.env.NODE_ENV !== 'production';

    const product = await this.productModel.findByPk(createOrderDto.productId, {
      include: [{ model: User, as: 'seller' }],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < createOrderDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    let deliveryCompanyId = createOrderDto.deliveryCompanyId || null;

    const unitPrice = product.price;
    const totalPrice = unitPrice * createOrderDto.quantity;

    // Generate secure codes
    const barcodeShortCode = this.generateShortBarcode();
    const deliveryCode = this.generateDeliveryCode();

    const order = await this.orderModel.create({
      buyerId,
      sellerId: product.sellerId,
      productId: product.id,
      deliveryCompanyId,
      quantity: createOrderDto.quantity,
      unitPrice,
      totalPrice,
      deliveryAddress: createOrderDto.deliveryAddress,
      deliveryCity: createOrderDto.deliveryCity,
      deliveryState: createOrderDto.deliveryState,
      selectedRoute: createOrderDto.selectedRoute,
      barcodeShortCode,
      deliveryCode,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      trackingHistory: [
        {
          status: OrderStatus.PENDING,
          timestamp: new Date(),
          remarks: 'Order created',
        },
      ],
    } as any);

    // 🔔 PUSH NOTIFICATION: Order created
    try {
      await this.notificationsService.sendPushNotification(
        buyerId,
        '🎉 Order Created Successfully',
        `Your order #${order.id} has been placed. Total: $${totalPrice.toFixed(2)}`,
        {
          orderId: order.id,
          orderNumber: order.id,
          totalPrice,
          status: OrderStatus.PENDING,
          type: 'order_created',
        },
      );

      // Notify seller about new order
      if (product.sellerId) {
        await this.notificationsService.sendPushNotification(
          product.sellerId,
          '📦 New Order Received',
          `You have a new order #${order.id} for ${product.name}`,
          {
            orderId: order.id,
            productName: product.name,
            quantity: createOrderDto.quantity,
            barcodeShortCode,
            type: 'new_order_seller',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send order creation notifications:', error);
    }

    // In development, skip sending emails
    if (isDev) {
      return order;
    }

    // Send codes asynchronously
    this.sendOrderCodes(order).catch((error) => {
      console.error('Failed to send order emails:', error?.message || error);
    });

    return order;
  }

  /**
   * Map internal Order model to frontend-friendly shape.
   */
  mapOrderForFrontend(order: Order & { product?: Product }): any {
    return {
      id: order.id,
      buyerId: order.buyerId,
      totalAmount: Number(order.totalPrice),
      status: order.status,
      deliveryAddress: order.deliveryAddress,
      deliveryCode: order.deliveryCode,
      packageBarcode: order.barcodeShortCode,
      paymentReference: order.paystackReference,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      driverId: (order as any).driverId,
      driver: (order as any).driver
        ? {
            id: (order as any).driver.id,
            name: (order as any).driver.name,
            email: (order as any).driver.email,
            phone: (order as any).driver.phone,
          }
        : null,
      buyer: (order as any).buyer
        ? {
            id: (order as any).buyer.id,
            firstName: (order as any).buyer.firstName,
            lastName: (order as any).buyer.lastName,
            email: (order as any).buyer.email,
            phone: (order as any).buyer.phone,
          }
        : null,
      seller: (order as any).seller
        ? {
            id: (order as any).seller.id,
            firstName: (order as any).seller.firstName,
            lastName: (order as any).seller.lastName,
            email: (order as any).seller.email,
            phone: (order as any).seller.phone,
          }
        : null,
      items: [
        {
          id: `${order.id}-item`,
          orderId: order.id,
          productId: order.productId,
          quantity: order.quantity,
          price: Number(order.unitPrice),
          product: order.product || null,
        },
      ],
    };
  }

  mapOrdersForFrontend(orders: Array<Order & { product?: Product }>): any[] {
    return orders.map((o) => this.mapOrderForFrontend(o));
  }

  async confirmPackageReceived(
    orderId: string,
    barcodeShortCode: string,
    packagePhoto: string,
    userId: string,
  ) {
    console.log('📦 confirmPackageReceived called:', { orderId, userId, barcodeShortCode });

    const order = await this.orderModel.findByPk(orderId, {
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: DeliveryCompany },
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user is a driver or company admin
    const driver = await this.driverModel.findOne({ where: { userId } });
    const company = await this.deliveryCompanyModel.findOne({ where: { userId } });

    if (!driver && !company) {
      throw new ForbiddenException(
        'User must be a driver or company admin to confirm package receipt',
      );
    }

    if (!order.deliveryCompanyId) {
      throw new ForbiddenException('This order has not been assigned to any delivery company yet');
    }

    // Validate authorization
    if (driver) {
      if (order.driverId !== driver.id) {
        throw new ForbiddenException('This order is not assigned to you');
      }

      if (!driver.companyId && order.deliveryCompanyId) {
        await driver.update({ companyId: order.deliveryCompanyId });
      } else if (driver.companyId && order.deliveryCompanyId !== driver.companyId) {
        throw new ForbiddenException('This order is not assigned to your company');
      }
    } else if (company) {
      if (order.deliveryCompanyId !== company.id) {
        throw new ForbiddenException('This order is not assigned to your company');
      }
    }

    if (order.barcodeShortCode !== barcodeShortCode) {
      throw new BadRequestException('Invalid barcode');
    }

    await order.update({
      status: OrderStatus.PACKAGE_RECEIVED,
      trackingHistory: [
        ...order.trackingHistory,
        {
          status: OrderStatus.PACKAGE_RECEIVED,
          timestamp: new Date(),
          remarks: `Package received at delivery company. Photo: ${packagePhoto}`,
        },
      ],
    });

    // 🔔 PUSH NOTIFICATION: Package received
    try {
      // Notify buyer
      await this.notificationsService.sendPushNotification(
        order.buyerId,
        '📦 Package Received by Delivery Company',
        `Your order #${order.id} has been received by the delivery company`,
        {
          orderId: order.id,
          orderNumber: order.id,
          status: OrderStatus.PACKAGE_RECEIVED,
          type: 'package_received',
        },
      );

      // Notify seller
      if (order.sellerId) {
        await this.notificationsService.sendPushNotification(
          order.sellerId,
          '✅ Package Picked Up',
          `Order #${order.id} has been picked up by the delivery company`,
          {
            orderId: order.id,
            orderNumber: order.id,
            type: 'package_picked_up',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send package received notifications:', error);
    }

    // Send emails asynchronously
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      (async () => {
        try {
          let driverName = 'Delivery Driver';
          if (order.driverId && driver) {
            driverName = driver.name || 'Delivery Driver';
          }

          const companyName = order.deliveryCompany?.companyName || 'Delivery Company';

          await this.mailerService.sendMail({
            to: order.buyer.email,
            subject: 'Package Received by Delivery Company',
            template: 'package-received',
            context: {
              orderNumber: order.id,
              buyerName: order.buyer.firstName || order.buyer.email,
              driverName: driverName,
              companyName: companyName,
              deliveryAddress: order.deliveryAddress || 'Your specified address',
              trackingLink: `${process.env.FRONTEND_URL}/tracking/${order.id}`,
            },
          });
        } catch (error) {
          console.error('Failed to send package received email:', error?.message || error);
        }
      })();
    }

    return order;
  }

  async confirmDelivery(
    orderId: string,
    deliveryCode: string,
    deliveryPhoto: string | undefined,
    geolocation: { latitude: number; longitude: number } | undefined,
    userId: string,
    userRole: string,
  ) {
    const order = await this.orderModel.findByPk(orderId, {
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: DeliveryCompany },
        { model: Driver },
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Role-based ownership checks
    if (userRole === 'driver') {
      if (!order.deliveryCompanyId) {
        throw new ForbiddenException(
          'This order has not been assigned to any delivery company yet',
        );
      }
    } else if (userRole === 'company') {
      const company = await this.deliveryCompanyModel.findOne({ where: { userId } });
      if (!company) {
        throw new ForbiddenException('Delivery company profile not found for this user');
      }
      if (order.deliveryCompanyId !== company.id) {
        throw new ForbiddenException('This order is not assigned to your company');
      }
    } else if (userRole === 'buyer') {
      if (order.buyerId !== userId) {
        throw new ForbiddenException('This order does not belong to you');
      }
    }

    const safeGeo = geolocation || { latitude: 0, longitude: 0 };
    const safePhoto = deliveryPhoto || 'Delivered (no photo provided)';

    // CRITICAL: Verify delivery code
    if (order.deliveryCode !== deliveryCode) {
      // BLOCK DELIVERY
      await order.update({
        status: OrderStatus.FAILED,
        trackingHistory: [
          ...order.trackingHistory,
          {
            status: OrderStatus.FAILED,
            timestamp: new Date(),
            remarks: `DELIVERY BLOCKED: Wrong delivery code entered. Location: ${JSON.stringify(
              safeGeo,
            )}`,
          },
        ],
      });

      // 🔔 PUSH NOTIFICATION: Failed delivery alert
      try {
        // Alert buyer
        await this.notificationsService.sendPushNotification(
          order.buyerId,
          '🚨 DELIVERY ALERT: Wrong Code Entered',
          `Someone attempted to deliver order #${order.id} with incorrect code. Your order is safe.`,
          {
            orderId: order.id,
            orderNumber: order.id,
            type: 'delivery_failed_alert',
          },
        );

        // Alert seller
        if (order.sellerId) {
          await this.notificationsService.sendPushNotification(
            order.sellerId,
            '🚨 Delivery Blocked - Wrong Code',
            `Failed delivery attempt for order #${order.id}. Admin notified.`,
            {
              orderId: order.id,
              type: 'delivery_failed_alert',
            },
          );
        }

        // Alert delivery company
        if (order.deliveryCompany?.userId) {
          await this.notificationsService.sendPushNotification(
            order.deliveryCompany.userId,
            '🚨 SECURITY ALERT: Wrong Delivery Code',
            `Wrong code entered for order #${order.id}. Investigate immediately.`,
            {
              orderId: order.id,
              type: 'security_alert',
            },
          );
        }
      } catch (error) {
        this.logger.error('Failed to send failed delivery alerts:', error);
      }

      // In production, send alert emails
      const isDev = process.env.NODE_ENV !== 'production';
      if (!isDev) {
        try {
          await this.sendFailedDeliveryAlerts(order, deliveryCode, safeGeo);
        } catch (error) {
          console.error('Failed to send failed delivery alerts:', error?.message || error);
        }
      }

      throw new BadRequestException(
        'Invalid delivery code. Delivery blocked. Admin has been notified.',
      );
    }

    // SUCCESS - Complete delivery
    await order.update({
      status: OrderStatus.DELIVERED,
      deliveredAt: new Date(),
      trackingHistory: [
        ...order.trackingHistory,
        {
          status: OrderStatus.DELIVERED,
          timestamp: new Date(),
          remarks: `Delivered successfully. Photo: ${safePhoto}. Location: ${JSON.stringify(
            safeGeo,
          )}`,
        },
      ],
    });

    // 🔔 PUSH NOTIFICATION: Delivery successful
    try {
      // Notify buyer
      await this.notificationsService.sendPushNotification(
        order.buyerId,
        '✅ Package Delivered Successfully!',
        `Your order #${order.id} has been delivered. Enjoy your purchase!`,
        {
          orderId: order.id,
          orderNumber: order.id,
          deliveredAt: new Date().toISOString(),
          type: 'delivery_successful',
        },
      );

      // Notify seller
      if (order.sellerId) {
        await this.notificationsService.sendPushNotification(
          order.sellerId,
          '✅ Order Delivered',
          `Order #${order.id} has been successfully delivered to the customer`,
          {
            orderId: order.id,
            orderNumber: order.id,
            type: 'delivery_complete_seller',
          },
        );
      }

      // Notify delivery company
      if (order.deliveryCompany?.userId) {
        await this.notificationsService.sendPushNotification(
          order.deliveryCompany.userId,
          '🎉 Delivery Completed',
          `Order #${order.id} delivered successfully by your team`,
          {
            orderId: order.id,
            orderNumber: order.id,
            type: 'delivery_complete_company',
          },
        );
      }

      // Notify driver
      if (order.driver?.userId) {
        await this.notificationsService.sendPushNotification(
          order.driver.userId,
          '🎉 Delivery Complete!',
          `Great job! Order #${order.id} delivered successfully`,
          {
            orderId: order.id,
            orderNumber: order.id,
            type: 'delivery_complete_driver',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send delivery success notifications:', error);
    }

    // Send notifications asynchronously
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      this.sendDeliverySuccessNotifications(order).catch((error) => {
        console.error('Failed to send delivery success notifications:', error?.message || error);
      });
    }

    return order;
  }

  async getOrdersByUser(userId: string, role: string) {
    const where: any = {};

    if (role === 'buyer') {
      where.buyerId = userId;
    } else if (role === 'seller') {
      where.sellerId = userId;
    } else if (role === 'company' || role === 'delivery_company') {
      // Find the company by userId first
      const company = await this.deliveryCompanyModel.findOne({
        where: { userId },
      });

      if (company) {
        where.deliveryCompanyId = company.id;
      } else {
        // No company profile found, return empty
        return [];
      }
    } else if (role === 'driver') {
      // Find the driver by userId first
      const driver = await this.driverModel.findOne({
        where: { userId },
      });

      if (driver) {
        where.driverId = driver.id;
      } else {
        // No driver profile found, return empty
        return [];
      }
    }

    return this.orderModel.findAll({
      where,
      include: [
        { model: Product },
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: DeliveryCompany },
        { model: Driver },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async getOrderById(orderId: string) {
    const order = await this.orderModel.findByPk(orderId, {
      include: [
        { model: Product },
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: DeliveryCompany },
        { model: Driver },
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getUnassignedOrders() {
    const orders = await this.orderModel.findAll({
      where: {
        deliveryCompanyId: null,
        status: { [Op.in]: ['pending', 'payment_confirmed'] },
      },
      include: [
        { model: Product },
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: DeliveryCompany },
        { model: Driver },
      ],
      order: [['createdAt', 'DESC']],
    });

    return orders;
  }

  /**
   * Update order status to PAYMENT_CONFIRMED after successful payment
   */
  async confirmPayment(orderId: string) {
    const order = await this.orderModel.findByPk(orderId, {
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: Product },
        { model: DeliveryCompany },
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order payment already confirmed or processed');
    }

    await order.update({
      status: OrderStatus.PAYMENT_CONFIRMED,
      paymentStatus: PaymentStatus.SUCCESS,
      trackingHistory: [
        ...order.trackingHistory,
        {
          status: OrderStatus.PAYMENT_CONFIRMED,
          timestamp: new Date(),
          remarks: 'Payment confirmed successfully',
        },
      ],
    });

    // 🔔 PUSH NOTIFICATION: Payment confirmed
    try {
      // Notify buyer
      await this.notificationsService.sendPushNotification(
        order.buyerId,
        '✅ Payment Confirmed',
        `Your payment for order #${order.id} was successful. Processing your order now!`,
        {
          orderId: order.id,
          orderNumber: order.id,
          amount: Number(order.totalPrice),
          type: 'payment_confirmed',
        },
      );

      // Notify seller
      if (order.sellerId) {
        await this.notificationsService.sendPushNotification(
          order.sellerId,
          '💰 Payment Received',
          `Payment received for order #${order.id}. Prepare package for pickup (Barcode: ${order.barcodeShortCode})`,
          {
            orderId: order.id,
            orderNumber: order.id,
            barcodeShortCode: order.barcodeShortCode,
            type: 'payment_received_seller',
          },
        );
      }

      // Notify delivery company if assigned
      if (order.deliveryCompany?.userId) {
        await this.notificationsService.sendPushNotification(
          order.deliveryCompany.userId,
          '📦 New Order Ready for Pickup',
          `Order #${order.id} is ready for pickup. Barcode: ${order.barcodeShortCode}`,
          {
            orderId: order.id,
            orderNumber: order.id,
            barcodeShortCode: order.barcodeShortCode,
            pickupAddress: order.deliveryAddress,
            type: 'order_ready_pickup',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send payment confirmation notifications:', error);
    }

    // Send notifications to buyer, seller, and delivery company
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      this.sendPaymentConfirmedNotifications(order).catch((error) => {
        console.error('Failed to send payment confirmed notifications:', error?.message || error);
      });
    }

    return order;
  }

  /**
   * Driver marks order as picked up from warehouse
   */
  async markAsPickedUp(orderId: string, userId: string, userRole: string) {
    const order = await this.orderModel.findByPk(orderId, {
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: DeliveryCompany },
        { model: Driver },
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify authorization
    if (userRole === 'driver') {
      if (!order.driverId) {
        throw new ForbiddenException('This order has not been assigned to any driver yet');
      }
    } else if (userRole === 'company') {
      const company = await this.deliveryCompanyModel.findOne({ where: { userId } });
      if (!company || order.deliveryCompanyId !== company.id) {
        throw new ForbiddenException('This order is not assigned to your company');
      }
    } else {
      throw new ForbiddenException('Only drivers or delivery companies can update pickup status');
    }

    await order.update({
      status: OrderStatus.PICKED_UP,
      trackingHistory: [
        ...order.trackingHistory,
        {
          status: OrderStatus.PICKED_UP,
          timestamp: new Date(),
          remarks: 'Package picked up from warehouse',
        },
      ],
    });

    // 🔔 PUSH NOTIFICATION: Package picked up
    try {
      const driverName = order.driver?.name || 'Driver';
      const companyName = order.deliveryCompany?.companyName || 'Delivery Company';

      // Notify buyer
      await this.notificationsService.sendPushNotification(
        order.buyerId,
        '📦 Package Picked Up',
        `${driverName} has picked up your order #${order.id} from ${companyName}`,
        {
          orderId: order.id,
          orderNumber: order.id,
          driverName,
          companyName,
          type: 'package_picked_up',
        },
      );

      // Notify seller
      if (order.sellerId) {
        await this.notificationsService.sendPushNotification(
          order.sellerId,
          '✅ Package Picked Up',
          `Order #${order.id} has been picked up by ${companyName}`,
          {
            orderId: order.id,
            orderNumber: order.id,
            type: 'pickup_confirmed_seller',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send pickup notifications:', error);
    }

    // Send notifications
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      this.sendPickedUpNotifications(order).catch((error) => {
        console.error('Failed to send picked up notifications:', error?.message || error);
      });
    }

    return order;
  }

  /**
   * Driver marks order as out for delivery
   */
  async markAsOutForDelivery(orderId: string, userId: string, userRole: string) {
    const order = await this.orderModel.findByPk(orderId, {
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: DeliveryCompany },
        { model: Driver },
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify authorization
    if (userRole === 'driver') {
      if (!order.driverId) {
        throw new ForbiddenException('This order has not been assigned to any driver yet');
      }
    } else if (userRole === 'company') {
      const company = await this.deliveryCompanyModel.findOne({ where: { userId } });
      if (!company || order.deliveryCompanyId !== company.id) {
        throw new ForbiddenException('This order is not assigned to your company');
      }
    } else {
      throw new ForbiddenException('Only drivers or delivery companies can update delivery status');
    }

    await order.update({
      status: OrderStatus.OUT_FOR_DELIVERY,
      trackingHistory: [
        ...order.trackingHistory,
        {
          status: OrderStatus.OUT_FOR_DELIVERY,
          timestamp: new Date(),
          remarks: 'Package is out for delivery',
        },
      ],
    });

    // 🔔 PUSH NOTIFICATION: Out for delivery
    try {
      const driverName = order.driver?.name || 'Driver';

      // Notify buyer
      await this.notificationsService.sendPushNotification(
        order.buyerId,
        '🚚 Your Package Is Out For Delivery!',
        `${driverName} is on the way with your order #${order.id}. Get ready!`,
        {
          orderId: order.id,
          orderNumber: order.id,
          driverName,
          deliveryAddress: order.deliveryAddress,
          deliveryCode: order.deliveryCode,
          type: 'out_for_delivery',
        },
      );

      // Notify seller
      if (order.sellerId) {
        await this.notificationsService.sendPushNotification(
          order.sellerId,
          '🚚 Package Out For Delivery',
          `Order #${order.id} is now out for delivery`,
          {
            orderId: order.id,
            orderNumber: order.id,
            type: 'out_for_delivery_seller',
          },
        );
      }

      // Notify company
      if (order.deliveryCompany?.userId) {
        await this.notificationsService.sendPushNotification(
          order.deliveryCompany.userId,
          '🚚 Driver Out For Delivery',
          `${driverName} is delivering order #${order.id}`,
          {
            orderId: order.id,
            orderNumber: order.id,
            driverName,
            type: 'driver_out_for_delivery',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send out for delivery notifications:', error);
    }

    // Send notifications asynchronously
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      this.sendOutForDeliveryNotifications(order).catch((error) => {
        console.error('Failed to send out for delivery notifications:', error?.message || error);
      });
    }

    return order;
  }

  // Helper methods
  private async findDeliveryCompaniesForLocation(city: string, state: string) {
    return this.deliveryCompanyModel.findAll({
      where: {
        isActive: true,
        subscriptionStatus: 'active',
      },
    });
  }

  private generateShortBarcode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  private generateDeliveryCode(): string {
    return crypto.randomBytes(5).toString('hex').toUpperCase();
  }

  private async sendOrderCodes(order: Order) {
    const [buyer, seller] = await Promise.all([
      this.userModel.findByPk(order.buyerId),
      this.userModel.findByPk(order.sellerId),
    ]);

    if (!buyer) {
      throw new NotFoundException('Buyer not found for this order');
    }

    if (!seller) {
      throw new NotFoundException('Seller not found for this order');
    }

    await this.mailerService.sendMail({
      to: buyer.email,
      subject: 'Your Order Confirmation & Delivery Code',
      html: `
        <h2>Order Confirmed</h2>
        <p>Order Number: ${order.id}</p>
        <p><strong>Barcode (for package): ${order.barcodeShortCode}</strong></p>
        <p><strong>Delivery Code (KEEP SECRET): ${order.deliveryCode}</strong></p>
        <p>The driver will need this code to complete delivery.</p>
      `,
    });

    await this.mailerService.sendMail({
      to: seller.email,
      subject: 'New Order - Package Barcode',
      html: `
        <h2>New Order Received</h2>
        <p>Order Number: ${order.id}</p>
        <p><strong>Barcode to write on package: ${order.barcodeShortCode}</strong></p>
        <p><strong>Delivery Code: ${order.deliveryCode}</strong></p>
      `,
    });
  }

  private async sendFailedDeliveryAlerts(order: Order, wrongCode: string, geolocation: any) {
    const alertEmail = {
      subject: '🚨 ALERT: Failed Delivery Attempt - Wrong Code',
      html: `
        <h2>DELIVERY BLOCKED</h2>
        <p>Order: ${order.id}</p>
        <p>Wrong code entered: ${wrongCode}</p>
        <p>Correct code: ${order.deliveryCode}</p>
        <p>Location: ${JSON.stringify(geolocation)}</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    };

    try {
      await this.mailerService.sendMail({
        to: process.env.ADMIN_EMAIL || 'admin@alabamarketplace.com',
        ...alertEmail,
      });
    } catch (error) {
      console.error('Failed to send alert to admin:', error?.message || error);
    }

    try {
      await this.mailerService.sendMail({
        to: order.buyer.email,
        ...alertEmail,
      });
    } catch (error) {
      console.error('Failed to send alert to buyer:', error?.message || error);
    }

    try {
      await this.mailerService.sendMail({
        to: order.seller.email,
        ...alertEmail,
      });
    } catch (error) {
      console.error('Failed to send alert to seller:', error?.message || error);
    }
  }

  private async sendPaymentConfirmedNotifications(
    order: Order & {
      buyer?: User;
      seller?: User;
      deliveryCompany?: DeliveryCompany;
    },
  ) {
    const trackingLink = `${process.env.FRONTEND_URL || 'https://alabamarketplace.com'}/tracking/${order.id}`;

    if (order.buyer?.email) {
      await this.mailerService.sendMail({
        to: order.buyer.email,
        subject: '✅ Payment Confirmed - Order Processing',
        html: `
          <h2>Payment Confirmed</h2>
          <p>Hello ${order.buyer.firstName || 'Customer'},</p>
          <p>Your payment for order <strong>#${order.id}</strong> has been confirmed.</p>
          <p>Your order is now being processed and will be assigned to a delivery company soon.</p>
          <p><a href="${trackingLink}">Track your order</a></p>
        `,
      });
    }

    if (order.seller?.email) {
      await this.mailerService.sendMail({
        to: order.seller.email,
        subject: '💰 Payment Received - Prepare Package',
        html: `
          <h2>Payment Received</h2>
          <p>Hello ${order.seller.firstName || 'Seller'},</p>
          <p>Payment confirmed for order <strong>#${order.id}</strong>.</p>
          <p><strong>Barcode: ${order.barcodeShortCode}</strong></p>
          <p>Please prepare the package for pickup by the delivery company.</p>
          <p><a href="${trackingLink}">View order details</a></p>
        `,
      });
    }

    if (order.deliveryCompany?.userId) {
      const companyUser = await this.userModel.findByPk(order.deliveryCompany.userId);
      if (companyUser?.email) {
        await this.mailerService.sendMail({
          to: companyUser.email,
          subject: '📦 New Order Ready for Pickup',
          html: `
            <h2>New Order Ready</h2>
            <p>Order <strong>#${order.id}</strong> is ready for pickup.</p>
            <p><strong>Barcode: ${order.barcodeShortCode}</strong></p>
            <p>Pickup Address: ${order.deliveryAddress}, ${order.deliveryCity}</p>
            <p><a href="${trackingLink}">View order details</a></p>
          `,
        });
      }
    }
  }

  private async sendPickedUpNotifications(
    order: Order & {
      buyer?: User;
      seller?: User;
      deliveryCompany?: DeliveryCompany;
    },
  ) {
    const trackingLink = `${process.env.FRONTEND_URL || 'https://alabamarketplace.com'}/tracking/${order.id}`;
    const companyName = order.deliveryCompany?.companyName || 'Delivery Company';

    if (order.buyer?.email) {
      try {
        await this.mailerService.sendMail({
          to: order.buyer.email,
          subject: '📦 Package Picked Up - On The Way',
          html: `
            <h2>Package Picked Up</h2>
            <p>Hello ${order.buyer.firstName || 'Customer'},</p>
            <p>Your order <strong>#${order.id}</strong> has been picked up by ${companyName}.</p>
            <p>It will be delivered to: ${order.deliveryAddress}</p>
            <p><a href="${trackingLink}">Track your delivery</a></p>
          `,
        });
      } catch (error) {
        console.error('Failed to send buyer email:', error?.message || error);
      }
    }

    if (order.seller?.email) {
      try {
        await this.mailerService.sendMail({
          to: order.seller.email,
          subject: '✅ Package Picked Up by Delivery Company',
          html: `
            <h2>Package Picked Up</h2>
            <p>Hello ${order.seller.firstName || 'Seller'},</p>
            <p>Your package for order <strong>#${order.id}</strong> has been picked up by ${companyName}.</p>
            <p><a href="${trackingLink}">Track delivery status</a></p>
          `,
        });
      } catch (error) {
        console.error('Failed to send seller email:', error?.message || error);
      }
    }
  }

  private async sendOutForDeliveryNotifications(
    order: Order & {
      buyer?: User;
      seller?: User;
      deliveryCompany?: DeliveryCompany;
      driver?: Driver;
    },
  ) {
    const trackingLink = `${process.env.FRONTEND_URL || 'https://alabamarketplace.com'}/tracking/${order.id}`;
    const companyName = order.deliveryCompany?.companyName || 'Delivery Company';
    const driverName = order.driver?.name || 'Driver';

    if (order.buyer?.email) {
      try {
        await this.mailerService.sendMail({
          to: order.buyer.email,
          subject: '🚚 Your Package Is Out For Delivery!',
          html: `
            <h2>Out For Delivery</h2>
            <p>Hello ${order.buyer.firstName || 'Customer'},</p>
            <p>Great news! Your order <strong>#${order.id}</strong> is out for delivery.</p>
            <p><strong>Driver:</strong> ${driverName}</p>
            <p><strong>Delivery Address:</strong> ${order.deliveryAddress}, ${order.deliveryCity}</p>
            <p>Your delivery code is: <strong>${order.deliveryCode}</strong></p>
            <p><em>Keep this code safe - the driver will need it to complete delivery.</em></p>
            <p><a href="${trackingLink}">Track in real-time</a></p>
          `,
        });
      } catch (error) {
        console.error('Failed to send buyer email:', error?.message || error);
      }
    }

    if (order.seller?.email) {
      try {
        await this.mailerService.sendMail({
          to: order.seller.email,
          subject: '🚚 Package Out For Delivery',
          html: `
            <h2>Out For Delivery</h2>
            <p>Hello ${order.seller.firstName || 'Seller'},</p>
            <p>Order <strong>#${order.id}</strong> is now out for delivery by ${companyName}.</p>
            <p><a href="${trackingLink}">Track delivery</a></p>
          `,
        });
      } catch (error) {
        console.error('Failed to send seller email:', error?.message || error);
      }
    }

    if (order.deliveryCompany?.userId) {
      try {
        const companyUser = await this.userModel.findByPk(order.deliveryCompany.userId);
        if (companyUser?.email) {
          await this.mailerService.sendMail({
            to: companyUser.email,
            subject: '🚚 Driver Out For Delivery',
            html: `
              <h2>Delivery In Progress</h2>
              <p>Order <strong>#${order.id}</strong> is out for delivery.</p>
              <p><strong>Driver:</strong> ${driverName}</p>
              <p><strong>Delivery Address:</strong> ${order.deliveryAddress}</p>
              <p><a href="${trackingLink}">Monitor delivery</a></p>
            `,
          });
        }
      } catch (error) {
        console.error('Failed to send company email:', error?.message || error);
      }
    }
  }

  private async sendDeliverySuccessNotifications(
    order: Order & {
      buyer?: User;
      seller?: User;
      deliveryCompany?: DeliveryCompany;
    },
  ) {
    const trackingLink = `${process.env.FRONTEND_URL || 'https://alabamarketplace.com'}/tracking/${order.id}`;
    const deliveryDate = new Date(order.deliveredAt).toLocaleString();
    const companyName = order.deliveryCompany?.companyName || 'Delivery Company';

    if (order.buyer?.email) {
      try {
        await this.mailerService.sendMail({
          to: order.buyer.email,
          subject: '✅ Your Order Has Been Delivered Successfully!',
          template: 'order-delivered',
          context: {
            buyerName: order.buyer.firstName || 'Valued Customer',
            orderNumber: order.id,
            companyName,
            trackingLink,
            deliveryDate,
            isBuyer: true,
            isSeller: false,
            isCompany: false,
          },
        });
      } catch (error) {
        console.error('Failed to send buyer delivery email:', error?.message || error);
      }
    }

    if (order.seller?.email) {
      try {
        await this.mailerService.sendMail({
          to: order.seller.email,
          subject: '✅ Order Delivered - Payment Ready',
          template: 'order-delivered',
          context: {
            sellerName: order.seller.firstName || 'Seller',
            orderNumber: order.id,
            companyName,
            trackingLink,
            deliveryDate,
            isBuyer: false,
            isSeller: true,
            isCompany: false,
          },
        });
      } catch (error) {
        console.error('Failed to send seller delivery email:', error?.message || error);
      }
    }

    if (order.deliveryCompany?.userId) {
      try {
        const companyUser = await this.userModel.findByPk(order.deliveryCompany.userId);
        if (companyUser?.email) {
          await this.mailerService.sendMail({
            to: companyUser.email,
            subject: '✅ Order Delivery Completed',
            template: 'order-delivered',
            context: {
              companyName,
              orderNumber: order.id,
              trackingLink,
              deliveryDate,
              isBuyer: false,
              isSeller: false,
              isCompany: true,
            },
          });
        }
      } catch (error) {
        console.error('Failed to send company delivery email:', error?.message || error);
      }
    }
  }
}
