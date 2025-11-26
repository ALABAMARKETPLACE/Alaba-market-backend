// src/modules/orders/orders.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
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

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(Product)
    private productModel: typeof Product,
    @InjectModel(DeliveryCompany)
    private deliveryCompanyModel: typeof DeliveryCompany,
    @InjectModel(User)
    private userModel: typeof User,
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

    // Initially do NOT assign a delivery company.
    // Orders start unassigned and any company can later "accept" them.
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

    // In development, skip sending emails to avoid slow/failed SMTP blocking order creation
    if (isDev) {
      return order;
    }

    // In production, send codes to buyer and seller (non-critical; don't break order on mail failure)
    try {
      await this.sendOrderCodes(order);
    } catch (error) {
      // Log and continue; email delivery failure should not prevent order creation
      console.error('Failed to send order emails:', error?.message || error);
    }

    return order;
  }

  /**
   * Map internal Order model to frontend-friendly shape.
   * Frontend expects: totalAmount, packageBarcode, paymentReference, items[], etc.
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
      // Expose driver info for company/driver tracking UIs
      driverId: (order as any).driverId,
      driver: (order as any).driver
        ? {
            id: (order as any).driver.id,
            name: (order as any).driver.name,
            email: (order as any).driver.email,
            phone: (order as any).driver.phone,
          }
        : null,
      // For now single-product order → one item
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

    // Resolve the delivery company for this user
    const company = await this.deliveryCompanyModel.findOne({ where: { userId } });
    if (!company) {
      throw new ForbiddenException('No delivery company profile associated with this user');
    }

    if (!order.deliveryCompanyId) {
      throw new ForbiddenException('This order has not been assigned to any delivery company yet');
    }

    if (order.deliveryCompanyId !== company.id) {
      throw new ForbiddenException('This order is not assigned to your company');
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

    // In development, skip sending emails to avoid SMTP delays
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      try {
        await this.mailerService.sendMail({
          to: order.buyer.email,
          subject: 'Package Received by Delivery Company',
          template: 'package-received',
          context: {
            orderNumber: order.id,
            productName: 'Product', // Include product details
            trackingLink: `${process.env.FRONTEND_URL}/tracking/${order.id}`,
          },
        });
      } catch (error) {
        console.error('Failed to send package received email:', error?.message || error);
      }
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
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Role-based ownership checks
    if (userRole === 'driver') {
      // For now, allow any authenticated driver to confirm delivery
      // as long as the order has been assigned to some delivery company
      if (!order.deliveryCompanyId) {
        throw new ForbiddenException('This order has not been assigned to any delivery company yet');
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
      // BLOCK DELIVERY - Send alerts
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

      // In production, send alert emails to admin, seller, buyer
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

    // In production, send success emails
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      try {
        await this.mailerService.sendMail({
          to: order.buyer.email,
          subject: 'Order Delivered Successfully',
          template: 'delivery-success',
          context: {
            orderNumber: order.id,
            deliveryPhoto,
          },
        });

        await this.mailerService.sendMail({
          to: order.seller.email,
          subject: 'Your Product Has Been Delivered',
          template: 'delivery-success',
          context: {
            orderNumber: order.id,
          },
        });
      } catch (error) {
        console.error('Failed to send delivery success emails:', error?.message || error);
      }
    }

    return order;
  }

  async getOrdersByUser(userId: string, role: string) {
    const where: any = {};
    
    if (role === 'buyer') {
      where.buyerId = userId;
    } else if (role === 'seller') {
      where.sellerId = userId;
    } else if (role === 'company') {
      where.deliveryCompanyId = userId;
    } else if (role === 'driver') {
      where.driverId = userId;
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

  // Helper methods
  private async findDeliveryCompaniesForLocation(city: string, state: string) {
    return this.deliveryCompanyModel.findAll({
      where: {
        isActive: true,
        subscriptionStatus: 'active',
      },
    });
    // TODO: Filter by routes that match city/state
  }

  private generateShortBarcode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 characters
  }

  private generateDeliveryCode(): string {
    return crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 characters
  }

  private async sendOrderCodes(order: Order) {
    // Fetch buyer and seller records to ensure we have valid email addresses
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

    // Send to buyer
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

    // Send to seller
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

  private async sendFailedDeliveryAlerts(
    order: Order,
    wrongCode: string,
    geolocation: any,
  ) {
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

    // Send to admin
    await this.mailerService.sendMail({
      to: process.env.ADMIN_EMAIL || 'admin@alabamarketplace.com',
      ...alertEmail,
    });

    // Send to buyer
    await this.mailerService.sendMail({
      to: order.buyer.email,
      ...alertEmail,
    });

    // Send to seller
    await this.mailerService.sendMail({
      to: order.seller.email,
      ...alertEmail,
    });
  }
}