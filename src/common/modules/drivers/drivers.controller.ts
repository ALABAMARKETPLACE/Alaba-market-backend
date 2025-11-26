
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
    const users = await this.driversService.findDriverDirectory(q)
    return { success: true, data: users }
  }

  @Get()
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all drivers for company' })
  @ApiQuery({ name: 'isAvailable', required: false, type: Boolean })
  findAll(
    @Req() req: any,
    @Query('isAvailable') isAvailable?: boolean,
  ) {
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
  getMyDeliveries(@CurrentUser() user: any) {
    return this.driversService.getAssignedDeliveries(user.driverId);
  }

  @Get('my-history')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get delivery history for driver' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyHistory(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ) {
    return this.driversService.getDeliveryHistory(user.driverId, limit);
  }

  @Get('my-stats')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get driver statistics' })
  getMyStats(@CurrentUser() user: any) {
    return this.driversService.getDriverStats(user.driverId);
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
  updateMyAvailability(
    @CurrentUser() user: any,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.driversService.updateAvailability(user.driverId, dto);
  }

  @Post('invite')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Invite driver to company' })
  async inviteDriver(
    @Body() body: { driverUserId: string; message?: string },
    @Req() req: any,
  ) {
    const invite = await this.driversService.inviteDriver(
      req.user.id,
      body.driverUserId,
      body.message,
    )
    return { success: true, data: invite }
  }

  @Get('my-invitations')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get invitations for current driver' })
  async getMyInvitations(@Req() req: any) {
    const invitations = await this.driversService.getInvitationsForDriver(req.user.id)
    return { success: true, data: invitations }
  }

  @Post('invitations/:id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Accept driver invitation' })
  async acceptInvitation(@Param('id') id: string, @Req() req: any) {
    const driver = await this.driversService.acceptInvitation(req.user.id, id)
    return { success: true, data: driver }
  }

  @Post('assign')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Assign order to driver' })
  assignToOrder(@Body() dto: AssignDriverDto) {
    return this.driversService.assignToOrder(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver by ID' })
  findById(@Param('id') id: string) {
    return this.driversService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Update driver' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
    @Req() req: any,
  ) {
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