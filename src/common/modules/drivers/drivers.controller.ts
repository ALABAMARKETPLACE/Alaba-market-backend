// =====================================================
// FILE: backend/src/modules/drivers/drivers.controller.ts
// =====================================================
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DriversService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { AssignDriverDto, UpdateAvailabilityDto } from '../delivery/dto/assigned-driver.dto';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/role.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { CurrentUser } from '../../decorators/current-user.decorator';

@ApiTags('Drivers')
@Controller('drivers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Create driver (Delivery Company only)' })
  @ApiResponse({ status: 201, description: 'Driver created successfully' })
  create(@Body() dto: CreateDriverDto, @Req() req: any) {
    return this.driversService.create(dto, req.user.companyId);
  }

  @Get('directory')
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Driver directory (all drivers)' })
  @ApiQuery({ name: 'q', required: false })
  async findDirectory(@Query('q') q: string) {
    const users = await this.driversService.findDriverDirectory(q);
    return { success: true, data: users };
  }

  @Get()
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all drivers for company' })
  @ApiQuery({ name: 'isAvailable', required: false, type: Boolean })
  findAll(@Req() req: any, @Query('isAvailable') isAvailable?: boolean) {
    return this.driversService.findAll(req.user.companyId, { isAvailable });
  }

  @Get('available')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Get available drivers' })
  findAvailable(@Req() req: any) {
    return this.driversService.findAvailableDrivers(req.user.companyId);
  }

  @Get('my-deliveries')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get assigned deliveries for driver' })
  async getMyDeliveries(@CurrentUser() user: any) {
    console.log('🌐 GET /drivers/my-deliveries for userId:', user?.id);
    // Use driverId if available, otherwise fetch by userId
    const driverId = user?.driverId || (await this.driversService.getDriverIdByUserId(user.id));
    console.log('🌐 Resolved driverId:', driverId);
    if (!driverId) {
      return {
        success: true,
        data: {
          items: [],
          total: 0,
          message:
            'No driver profile found. Accept company invitations to start receiving deliveries.',
        },
      };
    }
    const deliveries = await this.driversService.getAssignedDeliveries(driverId);
    console.log('🌐 Returning', deliveries.length, 'deliveries');
    return {
      success: true,
      data: {
        items: deliveries,
        total: deliveries.length,
        page: 1,
        limit: deliveries.length,
        pages: 1,
      },
    };
  }

  @Get('my-history')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get delivery history for driver' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyHistory(@CurrentUser() user: any, @Query('limit') limit?: number) {
    const driverId = user?.driverId || (await this.driversService.getDriverIdByUserId(user.id));
    if (!driverId) {
      return { success: true, data: [] };
    }
    return this.driversService.getDeliveryHistory(driverId, limit);
  }

  @Get('my-stats')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get driver statistics' })
  async getMyStats(@CurrentUser() user: any) {
    const driverId = user?.driverId || (await this.driversService.getDriverIdByUserId(user.id));
    if (!driverId) {
      return { success: true, data: { totalDeliveries: 0, completedDeliveries: 0, rating: 0 } };
    }
    return this.driversService.getDriverStats(driverId);
  }

  @Get(':id/stats')
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get driver statistics by ID' })
  getDriverStats(@Param('id') id: string) {
    return this.driversService.getDriverStats(id);
  }

  @Patch('availability')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Update driver availability' })
  updateMyAvailability(@CurrentUser() user: any, @Body() dto: UpdateAvailabilityDto) {
    if (!user?.driverId) {
      throw new BadRequestException('Driver ID is required for this operation');
    }
    return this.driversService.updateAvailability(user.driverId, dto);
  }

  @Post('invite')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Invite driver to company' })
  async inviteDriver(@Body() body: { driverUserId: string; message?: string }, @Req() req: any) {
    console.log('🌐 POST /drivers/invite received:', {
      companyUserId: req.user?.id,
      driverUserId: body.driverUserId,
      hasMessage: !!body.message,
    });

    const invite = await this.driversService.inviteDriver(
      req.user.id,
      body.driverUserId,
      body.message,
    );

    console.log('🌐 Invitation created/returned:', { id: invite.id, status: invite.status });
    return { success: true, data: invite };
  }

  @Get('my-invitations')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get invitations for current driver' })
  async getMyInvitations(@Req() req: any) {
    console.log('🌐 GET /drivers/my-invitations received for userId:', req.user?.id);

    if (!req?.user?.id) {
      throw new BadRequestException('User ID is required for this operation');
    }

    const invitations = await this.driversService.getInvitationsForDriver(req.user.id);
    console.log('🌐 Returning invitations count:', invitations.length);

    return { success: true, data: invitations };
  }

  @Post('invitations/:id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Accept driver invitation' })
  async acceptInvitation(@Param('id') id: string, @Req() req: any) {
    if (!req?.user?.id) {
      throw new BadRequestException('User ID is required for this operation');
    }
    const driver = await this.driversService.acceptInvitation(req.user.id, id);
    return { success: true, data: driver };
  }

  @Post('apply-to-company')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Apply to join a delivery company' })
  async applyToCompany(@Body() body: { companyId: string; message?: string }, @Req() req: any) {
    if (!req?.user?.id) {
      throw new BadRequestException('User ID is required for this operation');
    }
    const application = await this.driversService.applyToCompany(
      req.user.id,
      body.companyId,
      body.message,
    );
    return { success: true, data: application };
  }

  @Get('my-applications')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get my company applications' })
  async getMyApplications(@Req() req: any) {
    if (!req?.user?.id) {
      throw new BadRequestException('User ID is required for this operation');
    }
    const applications = await this.driversService.getMyApplications(req.user.id);
    return { success: true, data: applications };
  }

  @Post('assign')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Assign order to driver' })
  async assignToOrder(@Body() dto: AssignDriverDto) {
    const order = await this.driversService.assignToOrder(dto);
    return {
      success: true,
      data: order,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver by ID' })
  findById(@Param('id') id: string) {
    return this.driversService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Update driver' })
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto, @Req() req: any) {
    return this.driversService.update(id, req.user.companyId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Deactivate driver' })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @Req() req: any) {
    return this.driversService.delete(id, req.user.companyId);
  }
}
