// src/modules/delivery-company/delivery-company.controller.ts
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeliveryCompanyService } from './delivery-company.service';
import {
  CreateDeliveryCompanyDto,
  UpdateDeliveryCompanyDto,
} from './dto/create-delivery-company.dto';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/role.decorator';
// import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';

@ApiTags('Delivery Company')
@Controller('delivery-company')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DeliveryCompanyController {
  constructor(private deliveryCompanyService: DeliveryCompanyService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create delivery company profile' })
  create(@Body() dto: CreateDeliveryCompanyDto, @Req() req: any) {
    return this.deliveryCompanyService.create(req.user.id, dto);
  }

  @Get('my-company')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my company profile' })
  async getMyCompany(@Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    return {
      success: true,
      data: company,
    };
  }

  @Get('subscription-status')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check subscription status' })
  async checkSubscription(@Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    const status = await this.deliveryCompanyService.checkSubscriptionStatus(company.id);
    return {
      success: true,
      data: status,
    };
  }

  @Get('dashboard')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboard(@Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    const stats = await this.deliveryCompanyService.getDashboardStats(company.id);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('orders')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get company orders' })
  @ApiQuery({ name: 'status', required: false })
  async getOrders(@Query('status') status: string, @Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    const orders = await this.deliveryCompanyService.getOrders(company.id, status);
    return {
      success: true,
      data: orders,
    };
  }

  // Marketplace: list all unassigned orders any company can choose from
  @Get('marketplace-orders')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get unassigned orders marketplace' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'state', required: false })
  async getMarketplaceOrders(
    @Query('status') status: string,
    @Query('city') city: string,
    @Query('state') state: string,
  ) {
    const orders = await this.deliveryCompanyService.getUnassignedOrders(status, city, state);
    return {
      success: true,
      data: orders,
    };
  }

  // Accept an unassigned order and assign it to the logged-in company
  @Post('orders/:id/accept')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Accept an unassigned order for this company' })
  async acceptOrder(@Param('id') id: string, @Req() req: any) {
    const result = await this.deliveryCompanyService.acceptOrder(req.user.id, id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('drivers/directory')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all drivers directory' })
  async getDriverDirectory(@Query('page') page = 1, @Query('limit') limit = 100, @Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    const drivers = await this.deliveryCompanyService.getAllDrivers(page, limit, company.id);
    return {
      success: true,
      data: drivers,
    };
  }

  @Get('drivers')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get company drivers' })
  async getDrivers(@Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    const drivers = await this.deliveryCompanyService.getDrivers(company.id);
    return {
      success: true,
      data: drivers,
    };
  }

  @Post('drivers/invite')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Send invitation to driver' })
  async inviteDriver(@Body() body: { driverId: string; message?: string }, @Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    const result = await this.deliveryCompanyService.inviteDriver(
      company.id,
      body.driverId,
      body.message,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('applications')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get driver applications for this company' })
  async getApplications(@Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    const applications = await this.deliveryCompanyService.getDriverApplications(company.id);
    return {
      success: true,
      data: applications,
    };
  }

  @Post('applications/:applicationId/accept')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Accept driver application' })
  async acceptApplication(@Param('applicationId') applicationId: string, @Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    const result = await this.deliveryCompanyService.acceptDriverApplication(
      company.id,
      applicationId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('applications/:applicationId/reject')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject driver application' })
  async rejectApplication(@Param('applicationId') applicationId: string, @Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    const result = await this.deliveryCompanyService.rejectDriverApplication(
      company.id,
      applicationId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('all')
  @Roles(UserRole.DRIVER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all active delivery companies (for drivers to browse)' })
  async getAllCompanies(@Query('page') page = 1, @Query('limit') limit = 20) {
    const companies = await this.deliveryCompanyService.getAllActiveCompanies(page, limit);
    return {
      success: true,
      data: companies,
    };
  }

  @Put(':id')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update company profile' })
  update(@Param('id') id: string, @Body() dto: UpdateDeliveryCompanyDto, @Req() req: any) {
    return this.deliveryCompanyService.update(id, req.user.id, dto);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get company by ID' })
  getById(@Param('id') id: string) {
    return this.deliveryCompanyService.findById(id);
  }
}
