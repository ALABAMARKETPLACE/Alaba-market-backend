import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { DeliveryCompanyService } from "./delivery_company.service";
import { CreateDeliveryCompanyDto } from "./dto/create_delivery_company.dto";
import { CreateDriverDto } from "./dto/create_driver.dto";

@Controller("delivery")
export class DeliveryCompanyController {
  constructor(
    private readonly deliveryCompanyService: DeliveryCompanyService,
  ) {}

  @Post("company/register")
  async registerDeliveryCompany(@Body() dto: CreateDeliveryCompanyDto) {
    return await this.deliveryCompanyService.registerDeliveryCompany(dto);
  }

  @Post("driver/register")
  async registerDriver(@Body() dto: CreateDriverDto) {
    return await this.deliveryCompanyService.registerDriver(dto);
  }

  @Get("companies")
  async getAllDeliveryCompanies(
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    return await this.deliveryCompanyService.getAllDeliveryCompanies(status, search);
  }

  @Get("companies/approved")
  async getApprovedDeliveryCompanies() {
    return await this.deliveryCompanyService.getApprovedDeliveryCompanies();
  }

  @Get("company/:id")
  async getDeliveryCompanyById(@Param("id") id: number) {
    return await this.deliveryCompanyService.getDeliveryCompanyById(id);
  }

  @Put("company/:id/status")
  async updateStatus(
    @Param("id") id: number,
    @Body() body: { status: string; remark?: string },
  ) {
    return await this.deliveryCompanyService.updateStatus(
      id,
      body.status,
      body.remark,
    );
  }

  @Get("drivers")
  async getAllDrivers(
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    return await this.deliveryCompanyService.getAllDrivers(status, search);
  }

  @Get("driver/:id")
  async getDriverById(@Param("id") id: number) {
    return await this.deliveryCompanyService.getDriverById(id);
  }

  @Put("driver/:id/status")
  async updateDriverStatus(
    @Param("id") id: number,
    @Body() body: { status: string; remark?: string },
  ) {
    return await this.deliveryCompanyService.updateDriverStatus(
      id,
      body.status,
      body.remark,
    );
  }

  @Post("invitation/send")
  async sendInvitation(
    @Body() body: {
      driver_id: number;
      delivery_company_id: number;
      initiated_by: "driver" | "company";
      message?: string;
    },
  ) {
    return await this.deliveryCompanyService.sendInvitation(
      body.driver_id,
      body.delivery_company_id,
      body.initiated_by,
      body.message,
    );
  }

  @Get("invitation/driver/:driverId")
  async getDriverInvitations(@Param("driverId") driverId: number) {
    return await this.deliveryCompanyService.getDriverInvitations(driverId);
  }

  @Get("invitation/company/:companyId")
  async getCompanyInvitations(@Param("companyId") companyId: number) {
    return await this.deliveryCompanyService.getCompanyInvitations(companyId);
  }

  @Post("invitation/:id/accept")
  async acceptInvitation(@Param("id") id: number) {
    return await this.deliveryCompanyService.acceptInvitation(id);
  }

  @Post("invitation/:id/reject")
  async rejectInvitation(@Param("id") id: number) {
    return await this.deliveryCompanyService.rejectInvitation(id);
  }

  @Get("orders/available")
  async getAvailableOrders() {
    return await this.deliveryCompanyService.getAvailableOrders();
  }

  @Get("orders/debug")
  async debugOrders() {
    // Debug endpoint to check all orders
    const Order = this.deliveryCompanyService['orderRepository'];
    const allOrders = await Order.findAll({
      attributes: ['id', 'order_id', 'status', 'delivery_company_id', 'userId', 'storeId', 'createdAt'],
      limit: 10,
      order: [['createdAt', 'DESC']],
    });
    const totalCount = await Order.count();
    const unassignedCount = await Order.count({
      where: { delivery_company_id: null }
    });
    return {
      status: true,
      totalOrders: totalCount,
      unassignedOrders: unassignedCount,
      sampleOrders: allOrders,
    };
  }

  @Post("order/:orderId/accept")
  async acceptOrder(
    @Param("orderId") orderId: number,
    @Body() body: { company_id: number },
  ) {
    return await this.deliveryCompanyService.acceptOrder(orderId, body.company_id);
  }

  @Get("company/:companyId/drivers")
  async getCompanyDrivers(
    @Param("companyId") companyId: number,
    @Query("approvedOnly") approvedOnly?: string,
  ) {
    return await this.deliveryCompanyService.getCompanyDrivers(
      companyId,
      approvedOnly === "true",
    );
  }

  @Get("company/:companyId/drivers/available")
  async getAvailableDriversForInvitation(@Param("companyId") companyId: number) {
    // Use getAllDriversForCompany which returns canInvite and hasPendingInvitation fields
    return await this.deliveryCompanyService.getAllDriversForCompany(companyId);
  }

  @Get("company/:companyId/orders")
  async getCompanyOrders(@Param("companyId") companyId: number) {
    return await this.deliveryCompanyService.getCompanyOrders(companyId);
  }

  @Get("company/:companyId/orders/accepted")
  async getAcceptedOrders(@Param("companyId") companyId: number) {
    return await this.deliveryCompanyService.getAcceptedOrders(companyId);
  }

  @Get("company/:companyId/orders/accepted-with-drivers")
  async getAcceptedOrdersWithDrivers(@Param("companyId") companyId: number) {
    return await this.deliveryCompanyService.getAcceptedOrdersWithDrivers(companyId);
  }

  @Post("order/:orderId/pickup")
  @UseInterceptors(FileInterceptor("image"))
  async confirmPickup(
    @Param("orderId") orderId: number,
    @Body() body: { company_id: number; driver_id: number; pickup_code: string; description?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error("Image file is required");
    }
    return await this.deliveryCompanyService.confirmPickup(
      orderId,
      body.company_id,
      body.driver_id,
      body.pickup_code,
      file,
      body.description,
    );
  }

  @Get("driver/:driverId/orders")
  async getDriverOrders(@Param("driverId") driverId: number) {
    return await this.deliveryCompanyService.getDriverOrders(driverId);
  }

  @Get("driver/:driverId/orders/pending")
  async getDriverPendingOrders(@Param("driverId") driverId: number) {
    return await this.deliveryCompanyService.getDriverPendingOrders(driverId);
  }

  @Get("driver/:driverId/orders/completed")
  async getDriverCompletedOrders(@Param("driverId") driverId: number) {
    return await this.deliveryCompanyService.getDriverCompletedOrders(driverId);
  }

  @Get("driver/:driverId/orders/available")
  async getDriverAvailableOrders(@Param("driverId") driverId: number) {
    return await this.deliveryCompanyService.getDriverAvailableOrders(driverId);
  }

  @Post("driver/:driverId/order/:orderId/select")
  async driverSelectOrder(
    @Param("driverId") driverId: number,
    @Param("orderId") orderId: number,
  ) {
    return await this.deliveryCompanyService.driverSelectOrder(driverId, orderId);
  }

  @Post("order/:orderId/deliver")
  @UseInterceptors(FileInterceptor("image"))
  async confirmDelivery(
    @Param("orderId") orderId: number,
    @Body() body: { driver_id: number; order_otp: string; description?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error("Image file is required");
    }
    return await this.deliveryCompanyService.confirmDelivery(
      orderId,
      body.driver_id,
      body.order_otp,
      file,
      body.description,
    );
  }

  @Get("orders/all")
  async getAllOrders() {
    return await this.deliveryCompanyService.getAllOrders();
  }
}
