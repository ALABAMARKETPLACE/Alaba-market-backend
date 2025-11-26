// src/modules/orders/orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/role.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.BUYER, UserRole.COMPANY, UserRole.DRIVER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create order' })
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    const order = await this.ordersService.create(createOrderDto, req.user.id);
    const mapped = this.ordersService.mapOrderForFrontend(order as any);
    return { success: true, data: mapped };
  }

  @Get('my-orders')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user orders' })
  async getMyOrders(@Req() req: any) {
    const orders = await this.ordersService.getOrdersByUser(req.user.id, req.user.role);
    const mapped = this.ordersService.mapOrdersForFrontend(orders as any);
    return {
      success: true,
      data: {
        items: mapped,
        total: mapped.length,
        page: 1,
        limit: mapped.length,
        totalPages: 1,
      },
    };
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order by ID' })
  async getOrder(@Param('id') id: string) {
    const order = await this.ordersService.getOrderById(id);
    const mapped = this.ordersService.mapOrderForFrontend(order as any);
    return { success: true, data: mapped };
  }

  @Post(':id/package-received')
  @Roles(UserRole.BUYER, UserRole.DRIVER, UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm package received' })
  async confirmPackageReceived(
    @Param('id') id: string,
    @Body() body: { barcodeShortCode: string; packagePhoto: string },
    @Req() req: any,
  ) {
    const order = await this.ordersService.confirmPackageReceived(
      id,
      body.barcodeShortCode,
      body.packagePhoto,
      req.user.id,
    );
    const mapped = this.ordersService.mapOrderForFrontend(order as any);
    return { success: true, data: mapped };
  }

  @Post(':id/confirm-delivery')
  @Roles(UserRole.BUYER, UserRole.DRIVER, UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm delivery with code' })
  async confirmDelivery(
    @Param('id') id: string,
    @Body()
    body: {
      deliveryCode: string;
      deliveryPhoto?: string;
      geolocation?: { latitude: number; longitude: number };
    },
    @Req() req: any,
  ) {
    const order = await this.ordersService.confirmDelivery(
      id,
      body.deliveryCode,
      body.deliveryPhoto,
      body.geolocation,
      req.user.id,
      req.user.role,
    );
    const mapped = this.ordersService.mapOrderForFrontend(order as any);
    return { success: true, data: mapped };
  }
}



