// src/modules/delivery-company/delivery-company.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeliveryCompanyService } from './delivery-company.service';
import { CreateDeliveryCompanyDto, UpdateDeliveryCompanyDto } from './dto/create-delivery-company.dto';
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
  getMyCompany(@Req() req: any) {
    return this.deliveryCompanyService.findByUserId(req.user.id);
  }

  @Get('subscription-status')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check subscription status' })
  async checkSubscription(@Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    return this.deliveryCompanyService.checkSubscriptionStatus(company.id);
  }

  @Get('dashboard')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboard(@Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    return this.deliveryCompanyService.getDashboardStats(company.id);
  }

  @Get('orders')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get company orders' })
  @ApiQuery({ name: 'status', required: false })
  async getOrders(@Query('status') status: string, @Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    return this.deliveryCompanyService.getOrders(company.id, status);
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
    return this.deliveryCompanyService.getUnassignedOrders(status, city, state);
  }

  // Accept an unassigned order and assign it to the logged-in company
  @Post('orders/:id/accept')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Accept an unassigned order for this company' })
  async acceptOrder(@Param('id') id: string, @Req() req: any) {
    return this.deliveryCompanyService.acceptOrder(req.user.id, id);
  }

  @Get('drivers')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get company drivers' })
  async getDrivers(@Req() req: any) {
    const company = await this.deliveryCompanyService.findByUserId(req.user.id);
    return this.deliveryCompanyService.getDrivers(company.id);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update company profile' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryCompanyDto,
    @Req() req: any,
  ) {
    return this.deliveryCompanyService.update(id, req.user.id, dto);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get company by ID' })
  getById(@Param('id') id: string) {
    return this.deliveryCompanyService.findById(id);
  }
}