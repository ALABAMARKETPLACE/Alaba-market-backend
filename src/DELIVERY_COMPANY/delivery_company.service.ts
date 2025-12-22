import { Inject, Injectable, BadRequestException } from "@nestjs/common";
import { DeliveryCompany } from "./delivery_company.entity";
import { Driver } from "./driver.entity";
import { DriverInvitation } from "./driver_invitation.entity";
import { DriverOrder } from "./driver_order.entity";
import { CreateDeliveryCompanyDto } from "./dto/create_delivery_company.dto";
import { CreateDriverDto } from "./dto/create_driver.dto";
import { User } from "../USERS/user.entity";
import { Order } from "../ORDER/order.entity";
import * as bcrypt from "bcrypt";
import { Op } from "sequelize";
import { ImgcompressService } from "../IMAGE_COMPRESS/img_compress.service";

@Injectable()
export class DeliveryCompanyService {
  constructor(
    @Inject("DELIVERY_COMPANY_REPOSITORY")
    private readonly deliveryCompanyRepository: typeof DeliveryCompany,
    @Inject("DRIVER_REPOSITORY")
    private readonly driverRepository: typeof Driver,
    @Inject("DRIVER_INVITATION_REPOSITORY")
    private readonly driverInvitationRepository: typeof DriverInvitation,
    @Inject("DRIVER_ORDER_REPOSITORY")
    private readonly driverOrderRepository: typeof DriverOrder,
    @Inject("UserRepository")
    private readonly userRepository: typeof User,
    @Inject("OrderRepository")
    private readonly orderRepository: typeof Order,
    private readonly imgCompressService: ImgcompressService,
  ) {}

  async registerDeliveryCompany(dto: CreateDeliveryCompanyDto): Promise<any> {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException("Email already exists");
      }

      // Check if phone already exists
      const existingPhone = await this.userRepository.findOne({
        where: { phone: dto.phone },
      });

      if (existingPhone) {
        throw new BadRequestException("Phone number already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Create user entry
      const user = await this.userRepository.create({
        username: dto.email,
        email: dto.email,
        phone: dto.phone,
        countrycode: dto.countrycode || "+971",
        password: hashedPassword,
        name: dto.business_name,
        type: "delivery_company",
        role: "delivery_company",
        status: true,
        mail_verify: false,
        phone_verify: false,
      });

      // Create delivery company entry
      const deliveryCompany = await this.deliveryCompanyRepository.create({
        user_id: user._id,
        business_name: dto.business_name,
        phone: dto.phone,
        state: dto.state,
        city: dto.city,
        bank_name: dto.bank_name,
        account_number: dto.account_number,
        status: "pending",
      });

      return {
        status: true,
        message: "Delivery company registered successfully",
        data: {
          user_id: user._id,
          delivery_company_id: deliveryCompany.id,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async registerDriver(dto: CreateDriverDto): Promise<any> {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException("Email already exists");
      }

      // Check if phone already exists
      const existingPhone = await this.userRepository.findOne({
        where: { phone: dto.phone },
      });

      if (existingPhone) {
        throw new BadRequestException("Phone number already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Create user entry with driver type
      const user = await this.userRepository.create({
        username: dto.email,
        email: dto.email,
        phone: dto.phone,
        countrycode: dto.countrycode || "+971",
        password: hashedPassword,
        name: dto.full_name,
        type: "driver",
        role: "driver",
        status: true,
        mail_verify: false,
        phone_verify: false,
      });

      // Create driver entry (drivers are auto-approved, no admin approval needed)
      const driver = await this.driverRepository.create({
        user_id: user._id,
        full_name: dto.full_name,
        phone: dto.phone,
        state: dto.state,
        city: dto.city,
        license_number: dto.license_number,
        status: "approved", // Drivers are auto-approved
      });

      return {
        status: true,
        message: "Driver registered successfully",
        data: {
          user_id: user._id,
          driver_id: driver.id,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllDeliveryCompanies(status?: string, search?: string): Promise<any> {
    try {
      const where: any = {};
      if (status && status !== "all") {
        where.status = status;
      }

      if (search) {
        where[Op.or] = [
          { business_name: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const companies = await this.deliveryCompanyRepository.findAll({
        where,
        include: [
          {
            model: User,
            attributes: ['_id', 'name', 'email', 'phone', 'status'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Filter by search in user fields if search is provided
      let filteredCompanies = companies;
      if (search) {
        filteredCompanies = companies.filter((company) => {
          const user = company.user;
          if (user) {
            const emailMatch = user.email?.toLowerCase().includes(search.toLowerCase());
            const nameMatch = user.name?.toLowerCase().includes(search.toLowerCase());
            return emailMatch || nameMatch;
          }
          return false;
        });
      }

      return {
        status: true,
        data: filteredCompanies,
      };
    } catch (error) {
      throw error;
    }
  }

  async getDeliveryCompanyById(id: number): Promise<any> {
    try {
      const company = await this.deliveryCompanyRepository.findOne({
        where: { id },
        include: [
          {
            model: User,
            attributes: ['_id', 'name', 'email', 'phone', 'status'],
          },
        ],
      });

      if (!company) {
        throw new BadRequestException("Delivery company not found");
      }

      return {
        status: true,
        data: company,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateStatus(id: number, status: string, remark?: string): Promise<any> {
    try {
      const company = await this.deliveryCompanyRepository.findOne({
        where: { id },
      });

      if (!company) {
        throw new BadRequestException("Delivery company not found");
      }

      await company.update({
        status,
        status_remark: remark || company.status_remark,
      });

      return {
        status: true,
        message: "Status updated successfully",
        data: company,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get approved delivery companies (visible to drivers)
  async getApprovedDeliveryCompanies(): Promise<any> {
    try {
      const companies = await this.deliveryCompanyRepository.findAll({
        where: {
          status: "approved",
          is_active: true,
        },
        include: [
          {
            model: User,
            attributes: ['_id', 'name', 'email', 'phone', 'status'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return {
        status: true,
        data: companies,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all drivers (for admin and companies)
  async getAllDrivers(status?: string, search?: string): Promise<any> {
    try {
      const where: any = {};
      if (status && status !== "all") {
        where.status = status;
      }

      if (search) {
        where[Op.or] = [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { license_number: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const drivers = await this.driverRepository.findAll({
        where,
        include: [
          {
            model: User,
            attributes: ['_id', 'name', 'email', 'phone', 'status'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Filter by search in user fields if search is provided
      let filteredDrivers = drivers;
      if (search) {
        filteredDrivers = drivers.filter((driver) => {
          const user = driver.user;
          if (user) {
            const emailMatch = user.email?.toLowerCase().includes(search.toLowerCase());
            const nameMatch = user.name?.toLowerCase().includes(search.toLowerCase());
            return emailMatch || nameMatch;
          }
          return false;
        });
      }

      return {
        status: true,
        data: filteredDrivers,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get driver by ID
  async getDriverById(id: number): Promise<any> {
    try {
      const driver = await this.driverRepository.findOne({
        where: { id },
        include: [
          {
            model: User,
            attributes: ['_id', 'name', 'email', 'phone', 'status'],
          },
        ],
      });

      if (!driver) {
        throw new BadRequestException("Driver not found");
      }

      return {
        status: true,
        data: driver,
      };
    } catch (error) {
      throw error;
    }
  }

  // Admin: Update driver status
  async updateDriverStatus(id: number, status: string, remark?: string): Promise<any> {
    try {
      const driver = await this.driverRepository.findOne({
        where: { id },
      });

      if (!driver) {
        throw new BadRequestException("Driver not found");
      }

      await driver.update({
        status,
        status_remark: remark || driver.status_remark,
      });

      return {
        status: true,
        message: "Driver status updated successfully",
        data: driver,
      };
    } catch (error) {
      throw error;
    }
  }

  // Send invitation (driver to company or company to driver)
  async sendInvitation(
    driverId: number,
    companyId: number,
    initiatedBy: "driver" | "company",
    message?: string,
  ): Promise<any> {
    try {
      // Check if driver exists and is approved
      const driver = await this.driverRepository.findOne({
        where: { id: driverId },
      });

      if (!driver) {
        throw new BadRequestException("Driver not found");
      }

      if (driver.status !== "approved") {
        throw new BadRequestException("Driver must be approved to send/receive invitations");
      }

      // Check if driver has already accepted an invitation (restrict from sending more)
      if (initiatedBy === "driver") {
        const acceptedInvitation = await this.driverInvitationRepository.findOne({
          where: {
            driver_id: driverId,
            status: "accepted",
          },
        });

        if (acceptedInvitation) {
          throw new BadRequestException("Driver has already accepted an invitation and cannot send new requests");
        }
      }

      // Check if company exists and is approved
      const company = await this.deliveryCompanyRepository.findOne({
        where: { id: companyId },
      });

      if (!company) {
        throw new BadRequestException("Delivery company not found");
      }

      if (company.status !== "approved") {
        throw new BadRequestException("Delivery company must be approved to send/receive invitations");
      }

      // Check if invitation already exists
      const existingInvitation = await this.driverInvitationRepository.findOne({
        where: {
          driver_id: driverId,
          delivery_company_id: companyId,
          status: { [Op.in]: ["pending", "accepted"] },
        },
      });

      if (existingInvitation) {
        throw new BadRequestException("Invitation already exists");
      }

      // Create invitation
      const invitation = await this.driverInvitationRepository.create({
        driver_id: driverId,
        delivery_company_id: companyId,
        initiated_by: initiatedBy,
        message: message || null,
        status: "pending",
      });

      return {
        status: true,
        message: "Invitation sent successfully",
        data: invitation,
      };
    } catch (error) {
      throw error;
    }
  }

  // Accept invitation
  async acceptInvitation(invitationId: number): Promise<any> {
    try {
      const invitation = await this.driverInvitationRepository.findOne({
        where: { id: invitationId },
      });

      if (!invitation) {
        throw new BadRequestException("Invitation not found");
      }

      if (invitation.status !== "pending") {
        throw new BadRequestException("Invitation is not pending");
      }

      // Update invitation status
      await invitation.update({
        status: "accepted",
      });

      // Remove all other pending invitations for this driver
      await this.driverInvitationRepository.update(
        {
          status: "cancelled",
        },
        {
          where: {
            driver_id: invitation.driver_id,
            id: { [Op.ne]: invitationId },
            status: "pending",
          },
        },
      );

      return {
        status: true,
        message: "Invitation accepted successfully",
        data: invitation,
      };
    } catch (error) {
      throw error;
    }
  }

  // Reject invitation
  async rejectInvitation(invitationId: number): Promise<any> {
    try {
      const invitation = await this.driverInvitationRepository.findOne({
        where: { id: invitationId },
      });

      if (!invitation) {
        throw new BadRequestException("Invitation not found");
      }

      if (invitation.status !== "pending") {
        throw new BadRequestException("Invitation is not pending");
      }

      await invitation.update({
        status: "rejected",
      });

      return {
        status: true,
        message: "Invitation rejected successfully",
        data: invitation,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get invitations for a driver
  async getDriverInvitations(driverId: number): Promise<any> {
    try {
      const invitations = await this.driverInvitationRepository.findAll({
        where: { driver_id: driverId },
        order: [['createdAt', 'DESC']],
      });

      // Fetch related company details
      const invitationsWithDetails = await Promise.all(
        invitations.map(async (invitation) => {
          const company = await this.deliveryCompanyRepository.findOne({
            where: { id: invitation.delivery_company_id },
            include: [
              {
                model: User,
                attributes: ['_id', 'name', 'email', 'phone'],
              },
            ],
          });
          return {
            ...invitation.toJSON(),
            company,
          };
        }),
      );

      return {
        status: true,
        data: invitationsWithDetails,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get invitations for a company
  async getCompanyInvitations(companyId: number): Promise<any> {
    try {
      const invitations = await this.driverInvitationRepository.findAll({
        where: { delivery_company_id: companyId },
        order: [['createdAt', 'DESC']],
      });

      // Fetch related driver details
      const invitationsWithDetails = await Promise.all(
        invitations.map(async (invitation) => {
          const driver = await this.driverRepository.findOne({
            where: { id: invitation.driver_id },
            include: [
              {
                model: User,
                attributes: ['_id', 'name', 'email', 'phone'],
              },
            ],
          });
          return {
            ...invitation.toJSON(),
            driver,
          };
        }),
      );

      return {
        status: true,
        data: invitationsWithDetails,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get available orders (not accepted by any delivery company)
  async getAvailableOrders(): Promise<any> {
    try {
      const orders = await this.orderRepository.findAll({
        where: {
          delivery_company_id: null,
        },
        include: [
          {
            model: User,
            as: 'userDetails',
            attributes: ['_id', 'name', 'email', 'phone'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return {
        status: true,
        data: orders,
      };
    } catch (error) {
      throw error;
    }
  }

  // Accept an order by delivery company
  async acceptOrder(orderId: number, companyId: number): Promise<any> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        throw new BadRequestException("Order not found");
      }

      if (order.delivery_company_id) {
        throw new BadRequestException("Order has already been accepted by another delivery company");
      }

      // Get all drivers assigned to this company (accepted invitations)
      const companyDrivers = await this.driverInvitationRepository.findAll({
        where: {
          delivery_company_id: companyId,
          status: "accepted",
        },
      });

      const driverIds = companyDrivers.map((inv) => inv.driver_id);

      // Update order with delivery company and status (OTP and pickup code already generated at order creation)
      await order.update({
        delivery_company_id: companyId,
        status: "out_for_delivery",
      });

      // Link all company drivers to this order
      const driverOrderLinks = driverIds.map((driverId) => ({
        driver_id: driverId,
        order_id: orderId,
        assignment_status: "assigned",
        unique_assignment: `${driverId}_${orderId}`,
      }));

      // Bulk create driver-order links
      if (driverOrderLinks.length > 0) {
        await this.driverOrderRepository.bulkCreate(driverOrderLinks, {
          ignoreDuplicates: true,
        });
      }

      return {
        status: true,
        message: "Order accepted successfully. All company drivers have been linked to this order.",
        data: {
          order,
          linkedDrivers: driverIds.length,
          order_otp: order.order_otp,
          pickup_code: order.pickup_code,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get company's drivers (from invitations)
  async getCompanyDrivers(companyId: number, approvedOnly: boolean = false): Promise<any> {
    try {
      const where: any = { 
        delivery_company_id: companyId,
      };
      
      if (approvedOnly) {
        where.status = "accepted";
      }

      const invitations = await this.driverInvitationRepository.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      // Fetch driver details for each invitation
      const driversWithInvitations = await Promise.all(
        invitations.map(async (invitation) => {
          const driver = await this.driverRepository.findOne({
            where: { id: invitation.driver_id },
            include: [
              {
                model: User,
                attributes: ['_id', 'name', 'email', 'phone'],
              },
            ],
          });
          return {
            ...driver.toJSON(),
            invitation: {
              id: invitation.id,
              status: invitation.status,
              initiated_by: invitation.initiated_by,
              message: invitation.message,
              createdAt: invitation.createdAt,
            },
          };
        })
      );

      return {
        status: true,
        data: driversWithInvitations,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all drivers for company (for invitation section)
  async getAllDriversForCompany(companyId: number): Promise<any> {
    try {
      // Get all approved drivers
      const allDrivers = await this.driverRepository.findAll({
        where: {
          status: "approved",
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['_id', 'name', 'email', 'phone'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Get drivers who have accepted invitations from any company
      const acceptedInvitations = await this.driverInvitationRepository.findAll({
        where: {
          status: "accepted",
        },
      });

      // Convert to numbers for proper comparison (BIGINT can come as string)
      const acceptedDriverIds = acceptedInvitations.map((inv) => Number(inv.driver_id));

      // Get pending invitations from this company
      const companyInvitations = await this.driverInvitationRepository.findAll({
        where: {
          delivery_company_id: companyId,
          status: "pending",
        },
      });

      // Convert to numbers for proper comparison
      const companyInvitedDriverIds = companyInvitations.map((inv) => Number(inv.driver_id));

      // Add invitation status to each driver
      const driversWithStatus = allDrivers.map((driver) => {
        const driverId = Number(driver.id);
        const hasAccepted = acceptedDriverIds.includes(driverId);
        const hasPendingInvitation = companyInvitedDriverIds.includes(driverId);

        return {
          ...driver.toJSON(),
          canInvite: !hasAccepted, // Can only invite if not accepted by any company
          hasPendingInvitation: hasPendingInvitation,
        };
      });

      return {
        status: true,
        data: driversWithStatus,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all drivers (for invitation section - drivers who haven't accepted any company)
  async getAvailableDriversForInvitation(companyId: number): Promise<any> {
    try {
      // Get all approved drivers
      const allDrivers = await this.driverRepository.findAll({
        where: {
          status: "approved",
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['_id', 'name', 'email', 'phone'],
          },
        ],
      });

      // Get drivers who have accepted invitations
      const acceptedInvitations = await this.driverInvitationRepository.findAll({
        where: {
          status: "accepted",
        },
      });

      // Convert to numbers for proper comparison (BIGINT can come as string)
      const acceptedDriverIds = acceptedInvitations.map((inv) => Number(inv.driver_id));

      // Filter out drivers who have already accepted an invitation
      const availableDrivers = allDrivers.filter(
        (driver) => !acceptedDriverIds.includes(Number(driver.id))
      );

      // Check which drivers already have pending invitations from this company
      const companyInvitations = await this.driverInvitationRepository.findAll({
        where: {
          delivery_company_id: companyId,
          status: "pending",
        },
      });

      // Convert to numbers for proper comparison
      const pendingDriverIds = companyInvitations.map((inv) => Number(inv.driver_id));

      const driversWithInvitationStatus = availableDrivers.map((driver) => {
        const hasPendingInvitation = pendingDriverIds.includes(Number(driver.id));
        return {
          ...driver.toJSON(),
          has_pending_invitation: hasPendingInvitation,
        };
      });

      return {
        status: true,
        data: driversWithInvitationStatus,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get company's orders
  async getCompanyOrders(companyId: number): Promise<any> {
    try {
      const orders = await this.orderRepository.findAll({
        where: {
          delivery_company_id: companyId,
        },
        include: [
          {
            model: User,
            as: 'userDetails',
            attributes: ['_id', 'name', 'email', 'phone'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return {
        status: true,
        data: orders,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all orders (for delivery company to see all orders)
  async getAllOrders(): Promise<any> {
    try {
      const orders = await this.orderRepository.findAll({
        include: [
          {
            model: User,
            as: 'userDetails',
            attributes: ['_id', 'name', 'email', 'phone'],
          },
          {
            model: DeliveryCompany,
            attributes: ['id', 'business_name'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return {
        status: true,
        data: orders,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get driver's orders
  async getDriverOrders(driverId: number): Promise<any> {
    try {
      // Get all driver-order links for this driver
      const driverOrders = await this.driverOrderRepository.findAll({
        where: {
          driver_id: driverId,
        },
        include: [
          {
            model: Order,
            include: [
              {
                model: User,
                as: 'userDetails',
                attributes: ['_id', 'name', 'email', 'phone'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Extract orders from driver-order links
      const orders = driverOrders
        .map((driverOrder) => driverOrder.order)
        .filter((order) => order !== null);

      return {
        status: true,
        data: orders,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get accepted orders (not yet picked up) for a company
  async getAcceptedOrders(companyId: number): Promise<any> {
    try {
      const orders = await this.orderRepository.findAll({
        where: {
          delivery_company_id: companyId,
          status: { [Op.in]: ["out_for_delivery"] },
        },
        include: [
          {
            model: User,
            as: 'userDetails',
            attributes: ['_id', 'name', 'email', 'phone'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return {
        status: true,
        data: orders,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get accepted orders with driver assignments for a company
  async getAcceptedOrdersWithDrivers(companyId: number): Promise<any> {
    try {
      const orders = await this.orderRepository.findAll({
        where: {
          delivery_company_id: companyId,
          status: { [Op.in]: ["out_for_delivery", "picked_up"] },
        },
        include: [
          {
            model: User,
            as: 'userDetails',
            attributes: ['_id', 'name', 'email', 'phone'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // For each order, get the assigned drivers
      const ordersWithDrivers = await Promise.all(
        orders.map(async (order) => {
          const driverOrders = await this.driverOrderRepository.findAll({
            where: { order_id: order.id },
            include: [
              {
                model: Driver,
                include: [
                  {
                    model: User,
                    attributes: ['_id', 'name', 'email', 'phone'],
                  },
                ],
              },
            ],
          });

          const drivers = driverOrders.map((driverOrder) => ({
            driver_id: driverOrder.driver_id,
            driver_name: driverOrder.driver?.full_name,
            driver_phone: driverOrder.driver?.phone,
            assignment_status: driverOrder.assignment_status,
            is_assigned: driverOrder.assignment_status === "in_transit",
          }));

          return {
            ...order.toJSON(),
            assigned_drivers: drivers,
            primary_driver: drivers.find(d => d.assignment_status === "in_transit") || null,
          };
        })
      );

      return {
        status: true,
        data: ordersWithDrivers,
      };
    } catch (error) {
      throw error;
    }
  }

  // Confirm pickup with pickup code and image
  async confirmPickup(
    orderId: number,
    companyId: number,
    driverId: number,
    pickupCode: string,
    imageFile: Express.Multer.File,
    description?: string,
  ): Promise<any> {
    try {
      const order = await this.orderRepository.findOne({
        where: {
          id: orderId,
          delivery_company_id: companyId,
        },
      });

      if (!order) {
        throw new BadRequestException("Order not found or not assigned to this company");
      }

      if (order.pickup_code !== pickupCode) {
        throw new BadRequestException("Invalid pickup code");
      }

      if (order.status === "picked_up") {
        throw new BadRequestException("Order has already been picked up");
      }

      // Verify driver belongs to the company
      const driverInvitation = await this.driverInvitationRepository.findOne({
        where: {
          driver_id: driverId,
          delivery_company_id: companyId,
          status: "accepted",
        },
      });

      if (!driverInvitation) {
        throw new BadRequestException("Driver does not belong to this company");
      }

      // Verify driver is assigned to this order
      const driverOrder = await this.driverOrderRepository.findOne({
        where: {
          driver_id: driverId,
          order_id: orderId,
        },
      });

      if (!driverOrder) {
        throw new BadRequestException("Driver is not assigned to this order");
      }

      // Upload image to S3
      const uploadResult = await this.imgCompressService.imgCompressAndUpload(imageFile);
      const imageUrl = uploadResult.Location;

      // Use transaction for atomicity
      await this.orderRepository.sequelize.transaction(async (transaction) => {
        // Update order with pickup image, description and status
        await order.update({
          pickup_image: imageUrl,
          pickup_description: description || null,
          status: "picked_up",
        }, { transaction });

        // Update driver assignment to mark specific driver as in_transit
        await driverOrder.update({
          assignment_status: "in_transit",
        }, { transaction });

        // Mark all other drivers' assignments as unassigned for this order
        await this.driverOrderRepository.update(
          { assignment_status: "unassigned" },
          {
            where: {
              order_id: orderId,
              driver_id: { [Op.ne]: driverId },
            },
            transaction,
          }
        );
      });

      return {
        status: true,
        message: "Pickup confirmed successfully",
        data: {
          order: await this.orderRepository.findOne({
            where: { id: orderId },
            include: [{ model: User, as: 'userDetails', attributes: ['_id', 'name', 'email', 'phone'] }],
          }),
          pickup_image: imageUrl,
          pickup_description: description,
          assigned_driver_id: driverId,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get driver's pending orders (picked_up status, assigned to this driver)
  async getDriverPendingOrders(driverId: number): Promise<any> {
    try {
      // Get all driver-order links for this driver with in_transit status
      const driverOrders = await this.driverOrderRepository.findAll({
        where: {
          driver_id: driverId,
          assignment_status: "in_transit",
        },
        include: [
          {
            model: Order,
            where: {
              status: "picked_up",
            },
            include: [
              {
                model: User,
                as: 'userDetails',
                attributes: ['_id', 'name', 'email', 'phone'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Extract orders from driver-order links
      const orders = driverOrders
        .map((driverOrder) => driverOrder.order)
        .filter((order) => order !== null);

      return {
        status: true,
        data: orders,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get driver's completed orders (delivered status)
  async getDriverCompletedOrders(driverId: number): Promise<any> {
    try {
      // Get all driver-order links for this driver with delivered status
      const driverOrders = await this.driverOrderRepository.findAll({
        where: {
          driver_id: driverId,
          assignment_status: "delivered",
        },
        include: [
          {
            model: Order,
            where: {
              status: "delivered",
            },
            include: [
              {
                model: User,
                as: 'userDetails',
                attributes: ['_id', 'name', 'email', 'phone'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Extract orders from driver-order links
      const orders = driverOrders
        .map((driverOrder) => driverOrder.order)
        .filter((order) => order !== null);

      return {
        status: true,
        data: orders,
      };
    } catch (error) {
      throw error;
    }
  }

  // Driver selects/takes an order for delivery
  async driverSelectOrder(driverId: number, orderId: number): Promise<any> {
    try {
      // Find the driver-order assignment
      const driverOrder = await this.driverOrderRepository.findOne({
        where: {
          driver_id: driverId,
          order_id: orderId,
        },
      });

      if (!driverOrder) {
        throw new BadRequestException("You are not assigned to this order");
      }

      // Get the order
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        throw new BadRequestException("Order not found");
      }

      // Check if order is already picked up by another driver
      const existingInTransit = await this.driverOrderRepository.findOne({
        where: {
          order_id: orderId,
          assignment_status: "in_transit",
        },
      });

      if (existingInTransit && existingInTransit.driver_id !== driverId) {
        throw new BadRequestException("This order is already being handled by another driver");
      }

      // Update assignment status to in_transit
      await driverOrder.update({
        assignment_status: "in_transit",
      });

      // Mark all other drivers' assignments as unassigned for this order
      await this.driverOrderRepository.update(
        { assignment_status: "unassigned" },
        {
          where: {
            order_id: orderId,
            driver_id: { [Op.ne]: driverId },
          },
        }
      );

      return {
        status: true,
        message: "Order selected successfully. You are now responsible for this delivery.",
        data: {
          order_id: orderId,
          driver_id: driverId,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Confirm delivery with OTP validation
  async confirmDelivery(
    orderId: number,
    driverId: number,
    orderOtp: string,
    imageFile: Express.Multer.File,
    description?: string,
  ): Promise<any> {
    try {
      // Verify driver is assigned to this order with in_transit status
      const driverOrder = await this.driverOrderRepository.findOne({
        where: {
          driver_id: driverId,
          order_id: orderId,
          assignment_status: "in_transit",
        },
      });

      if (!driverOrder) {
        throw new BadRequestException("You are not assigned to deliver this order or order is not in transit");
      }

      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        throw new BadRequestException("Order not found");
      }

      if (order.status === "delivered") {
        throw new BadRequestException("Order has already been delivered");
      }

      if (order.status !== "picked_up") {
        throw new BadRequestException("Order must be picked up before delivery confirmation");
      }

      // Validate OTP
      if (order.order_otp !== orderOtp) {
        throw new BadRequestException("Invalid OTP. Please verify with the customer.");
      }

      // Upload delivery image to S3
      const uploadResult = await this.imgCompressService.imgCompressAndUpload(imageFile);
      const imageUrl = uploadResult.Location;

      // Use transaction for atomicity
      await this.orderRepository.sequelize.transaction(async (transaction) => {
        // Update order with delivery image, description and status
        await order.update({
          delivery_image: imageUrl,
          delivery_description: description || null,
          status: "delivered",
        }, { transaction });

        // Update driver assignment status
        await driverOrder.update({
          assignment_status: "delivered",
        }, { transaction });
      });

      return {
        status: true,
        message: "Delivery confirmed successfully",
        data: {
          order: await this.orderRepository.findOne({
            where: { id: orderId },
            include: [{ model: User, as: 'userDetails', attributes: ['_id', 'name', 'email', 'phone'] }],
          }),
          delivery_image: imageUrl,
          delivery_description: description,
          driver_id: driverId,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get orders available for driver to select (orders assigned to driver but not yet in transit)
  async getDriverAvailableOrders(driverId: number): Promise<any> {
    try {
      // Get all driver-order links for this driver with assigned status (not yet picked)
      const driverOrders = await this.driverOrderRepository.findAll({
        where: {
          driver_id: driverId,
          assignment_status: "assigned",
        },
        include: [
          {
            model: Order,
            where: {
              status: { [Op.in]: ["out_for_delivery", "picked_up"] },
            },
            include: [
              {
                model: User,
                as: 'userDetails',
                attributes: ['_id', 'name', 'email', 'phone'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Extract orders from driver-order links
      const orders = driverOrders
        .map((driverOrder) => driverOrder.order)
        .filter((order) => order !== null);

      return {
        status: true,
        data: orders,
      };
    } catch (error) {
      throw error;
    }
  }
}
