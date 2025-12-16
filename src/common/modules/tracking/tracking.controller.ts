// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete,
//   UseGuards,
//   Query,
// } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
// import { TrackingService } from './tracking.service';
// import { CreateTrackingDto } from './dto/create-log.dto';
// import { UpdateTrackingDto } from './dto/update-log.dto';
// import { TrackingResponseDto } from './dto/tracking-responds.dto';

// @ApiTags('Tracking')
// @Controller('tracking')
// export class TrackingController {
//   constructor(private readonly trackingService: TrackingService) {}

//   @Post()
//   @ApiOperation({ summary: 'Create a new tracking record' })
//   @ApiResponse({ status: 201, description: 'Tracking record created successfully', type: TrackingResponseDto })
//   @ApiResponse({ status: 400, description: 'Bad request' })
//   async create(@Body() createTrackingDto: CreateTrackingDto) {
//     return this.trackingService.create(createTrackingDto);
//   }

//   @Get()
//   @ApiOperation({ summary: 'Get all tracking records' })
//   @ApiResponse({ status: 200, description: 'List of all tracking records', type: [TrackingResponseDto] })
//   async findAll() {
//     return this.trackingService.findAll();
//   }

//   @Get('order/:orderId')
//   @ApiOperation({ summary: 'Get tracking records by order ID' })
//   @ApiResponse({ status: 200, description: 'Tracking records for the order', type: [TrackingResponseDto] })
//   async findByOrderId(@Param('orderId') orderId: string) {
//     return this.trackingService.findByOrderId(orderId);
//   }

//   @Get('order/:orderId/latest')
//   @ApiOperation({ summary: 'Get latest tracking record for an order' })
//   @ApiResponse({ status: 200, description: 'Latest tracking record', type: TrackingResponseDto })
//   @ApiResponse({ status: 404, description: 'No tracking records found' })
//   async getLatestByOrderId(@Param('orderId') orderId: string) {
//     return this.trackingService.getLatestByOrderId(orderId);
//   }

//   @Get('rider/:riderId')
//   @ApiOperation({ summary: 'Get tracking records by rider ID' })
//   @ApiResponse({ status: 200, description: 'Tracking records for the rider', type: [TrackingResponseDto] })
//   async findByRiderId(@Param('riderId') riderId: string) {
//     return this.trackingService.findByRiderId(riderId);
//   }

//   @Get(':id')
//   @ApiOperation({ summary: 'Get a tracking record by ID' })
//   @ApiResponse({ status: 200, description: 'Tracking record details', type: TrackingResponseDto })
//   @ApiResponse({ status: 404, description: 'Tracking record not found' })
//   async findOne(@Param('id') id: string) {
//     return this.trackingService.findOne(id);
//   }

//   @Patch(':id')
//   @ApiOperation({ summary: 'Update a tracking record' })
//   @ApiResponse({ status: 200, description: 'Tracking record updated successfully', type: TrackingResponseDto })
//   @ApiResponse({ status: 404, description: 'Tracking record not found' })
//   async update(
//     @Param('id') id: string,
//     @Body() updateTrackingDto: UpdateTrackingDto,
//   ) {
//     return this.trackingService.update(id, updateTrackingDto);
//   }

//   @Patch(':id/location')
//   @ApiOperation({ summary: 'Update tracking location' })
//   @ApiResponse({ status: 200, description: 'Location updated successfully', type: TrackingResponseDto })
//   async updateLocation(
//     @Param('id') id: string,
//     @Body() body: { latitude: number; longitude: number; address?: string },
//   ) {
//     return this.trackingService.updateLocation(id, body.latitude, body.longitude, body.address);
//   }

//   @Delete(':id')
//   @ApiOperation({ summary: 'Delete a tracking record' })
//   @ApiResponse({ status: 200, description: 'Tracking record deleted successfully' })
//   @ApiResponse({ status: 404, description: 'Tracking record not found' })
//   async remove(@Param('id') id: string) {
//     await this.trackingService.remove(id);
//     return { message: 'Tracking record deleted successfully' };
//   }
// }

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { CreateTrackingDto } from './dto/create-log.dto';
import { UpdateTrackingDto } from './dto/update-log.dto';
import { TrackingResponseDto } from './dto/tracking-responds.dto';
import {
  LocationUpdateDto,
  StartTrackingDto,
  StopTrackingDto,
  DriverIdsDto,
  OrderIdsDto,
} from './dto/location-update.dto';
import { DriverLocationResponseDto, OrderTrackingResponseDto } from './dto/tracking-response.dto';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {
    console.log('🚀 TrackingController initialized');
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tracking record' })
  @ApiResponse({
    status: 201,
    description: 'Tracking record created successfully',
    type: TrackingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createTrackingDto: CreateTrackingDto) {
    const tracking = await this.trackingService.create(createTrackingDto);
    return { success: true, data: tracking };
  }

  @Get()
  @ApiOperation({ summary: 'Get all tracking records' })
  @ApiResponse({
    status: 200,
    description: 'List of all tracking records',
    type: [TrackingResponseDto],
  })
  async findAll() {
    const items = await this.trackingService.findAll();
    return { success: true, data: items };
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get tracking records by order ID' })
  @ApiResponse({
    status: 200,
    description: 'Tracking records for the order',
    type: [TrackingResponseDto],
  })
  async findByOrderId(@Param('orderId') orderId: string) {
    const items = await this.trackingService.findByOrderId(orderId);
    return { success: true, data: items };
  }

  @Get('order/:orderId/latest')
  @ApiOperation({ summary: 'Get latest tracking record for an order' })
  @ApiResponse({ status: 200, description: 'Latest tracking record', type: TrackingResponseDto })
  @ApiResponse({ status: 404, description: 'No tracking records found' })
  async getLatestByOrderId(@Param('orderId') orderId: string) {
    const tracking = await this.trackingService.getLatestByOrderId(orderId);
    return { success: true, data: tracking };
  }

  @Get('rider/:riderId')
  @ApiOperation({ summary: 'Get tracking records by rider ID' })
  @ApiResponse({
    status: 200,
    description: 'Tracking records for the rider',
    type: [TrackingResponseDto],
  })
  async findByRiderId(@Param('riderId') riderId: string) {
    const items = await this.trackingService.findByRiderId(riderId);
    return { success: true, data: items };
  }

  // Specific routes MUST come before generic :id route
  @Get('company/drivers/locations')
  @ApiOperation({ summary: 'Get all active driver locations for a company' })
  @ApiResponse({ status: 200, description: 'List of driver locations' })
  async getCompanyDriversLocations(@Query('companyId') companyId?: string) {
    const locations = await this.trackingService.getCompanyDriversLocations(companyId);
    return { success: true, data: locations };
  }

  @Get('all-drivers')
  @ApiOperation({
    summary: 'Get all active driver locations (alias for company/drivers/locations)',
  })
  @ApiResponse({ status: 200, description: 'List of all active driver locations' })
  async getAllDriversLocations(@Query('companyId') companyId?: string) {
    try {
      console.log('🔵 GET /tracking/all-drivers called');
      const locations = await this.trackingService.getCompanyDriversLocations(companyId);
      console.log(`✅ Returning ${locations.length} locations`);
      return { success: true, data: locations };
    } catch (error) {
      console.error('❌ Error in getAllDriversLocations:', error.message);
      console.error('Stack:', error.stack);
      return { success: false, data: [], error: error.message };
    }
  }

  @Get('driver/:driverId/location')
  @ApiOperation({ summary: 'Get current location of a specific driver' })
  @ApiResponse({
    status: 200,
    description: 'Driver location',
    type: DriverLocationResponseDto,
  })
  async getDriverLocation(@Param('driverId') driverId: string) {
    const location = await this.trackingService.getDriverLocation(driverId);
    return { success: true, data: location };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tracking record by ID' })
  @ApiResponse({ status: 200, description: 'Tracking record details', type: TrackingResponseDto })
  @ApiResponse({ status: 404, description: 'Tracking record not found' })
  async findOne(@Param('id') id: string) {
    const tracking = await this.trackingService.findOne(id);
    return { success: true, data: tracking };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tracking record' })
  @ApiResponse({
    status: 200,
    description: 'Tracking record updated successfully',
    type: TrackingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tracking record not found' })
  async update(@Param('id') id: string, @Body() updateTrackingDto: UpdateTrackingDto) {
    const tracking = await this.trackingService.update(id, updateTrackingDto);
    return { success: true, data: tracking };
  }

  @Patch(':id/location')
  @ApiOperation({ summary: 'Update tracking location' })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    type: TrackingResponseDto,
  })
  async updateLocation(
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number; address?: string },
  ) {
    const tracking = await this.trackingService.updateLocation(
      id,
      body.latitude,
      body.longitude,
      body.address,
    );
    return { success: true, data: tracking };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tracking record' })
  @ApiResponse({ status: 200, description: 'Tracking record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tracking record not found' })
  async remove(@Param('id') id: string) {
    await this.trackingService.remove(id);
    return { success: true, message: 'Tracking record deleted successfully' };
  }

  @Post('drivers/locations')
  @ApiOperation({ summary: 'Get locations of multiple drivers' })
  @ApiResponse({
    status: 200,
    description: 'Array of driver locations',
    type: [DriverLocationResponseDto],
  })
  async getDriversLocations(@Body() body: DriverIdsDto) {
    const locations = await this.trackingService.getDriversLocations(body.driverIds);
    return { success: true, data: locations };
  }

  @Post('location/update')
  @ApiOperation({ summary: 'Update driver location (real-time GPS updates)' })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    type: DriverLocationResponseDto,
  })
  async updateDriverLocation(@Body() data: LocationUpdateDto) {
    const location = await this.trackingService.updateDriverLocation(data);
    return { success: true, data: location };
  }

  @Post('start')
  @ApiOperation({ summary: 'Start continuous location tracking for an order' })
  @ApiResponse({ status: 200, description: 'Tracking started' })
  async startTracking(@Body() body: StartTrackingDto) {
    const result = await this.trackingService.startTracking(body.orderId, body.driverId);
    return { success: true, data: result };
  }

  @Post('stop')
  @ApiOperation({ summary: 'Stop continuous location tracking' })
  @ApiResponse({ status: 200, description: 'Tracking stopped' })
  async stopTracking(@Body() body: StopTrackingDto) {
    await this.trackingService.stopTracking(body.orderId);
    return { success: true, message: 'Tracking stopped' };
  }

  @Get('order/:orderId/details')
  @ApiOperation({ summary: 'Get complete order tracking details with driver location' })
  @ApiResponse({
    status: 200,
    description: 'Order tracking details',
    type: OrderTrackingResponseDto,
  })
  async getOrderTrackingDetails(@Param('orderId') orderId: string) {
    const tracking = await this.trackingService.getOrderTrackingDetails(orderId);
    return { success: true, data: tracking };
  }

  @Post('orders')
  @ApiOperation({ summary: 'Get tracking for multiple orders' })
  @ApiResponse({ status: 200, description: 'Array of order tracking data' })
  async getOrdersTracking(@Body() body: OrderIdsDto) {
    const trackings = await Promise.all(
      body.orderIds.map((orderId) =>
        this.trackingService.getOrderTrackingDetails(orderId).catch(() => null),
      ),
    );
    const validTrackings = trackings.filter((t) => t !== null);
    return { success: true, data: validTrackings };
  }

  @Get('driver/:driverId/history')
  @ApiOperation({ summary: 'Get location history for a driver' })
  @ApiResponse({ status: 200, description: 'Driver location history' })
  async getLocationHistory(
    @Param('driverId') driverId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    const history = await this.trackingService.getLocationHistory(
      driverId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit ? parseInt(limit.toString()) : 100,
    );
    return { success: true, data: history };
  }
}
