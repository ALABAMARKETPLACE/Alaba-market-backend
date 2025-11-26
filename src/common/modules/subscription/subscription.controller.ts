import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.create(createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiResponse({ status: 200, description: 'List of all subscriptions', type: [SubscriptionResponseDto] })
  async findAll() {
    return this.subscriptionService.findAll();
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get subscriptions by status' })
  @ApiResponse({ status: 200, description: 'Subscriptions with specified status', type: [SubscriptionResponseDto] })
  async findByStatus(@Param('status') status: string) {
    return this.subscriptionService.findByStatus(status);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get subscriptions expiring soon' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days ahead (default: 7)' })
  @ApiResponse({ status: 200, description: 'Subscriptions expiring soon', type: [SubscriptionResponseDto] })
  async findExpiring(@Query('days') days?: number) {
    return this.subscriptionService.findExpiring(days ? parseInt(days.toString()) : 7);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all subscriptions for a user' })
  @ApiResponse({ status: 200, description: 'User subscriptions', type: [SubscriptionResponseDto] })
  async findByUserId(@Param('userId') userId: string) {
    return this.subscriptionService.findByUserId(userId);
  }

  @Get('user/:userId/active')
  @ApiOperation({ summary: 'Get active subscription for a user' })
  @ApiResponse({ status: 200, description: 'Active subscription', type: SubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async findActiveByUserId(@Param('userId') userId: string) {
    return this.subscriptionService.findActiveByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription details', type: SubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(id, updateSubscriptionDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancel(@Param('id') id: string) {
    return this.subscriptionService.cancel(id);
  }

  @Patch(':id/renew')
  @ApiOperation({ summary: 'Renew a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription renewed successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot renew subscription' })
  async renew(
    @Param('id') id: string,
    @Body() body: { endDate: Date; nextBillingDate?: Date },
  ) {
    return this.subscriptionService.renew(id, body.endDate, body.nextBillingDate);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async remove(@Param('id') id: string) {
    await this.subscriptionService.remove(id);
    return { message: 'Subscription deleted successfully' };
  }

  @Post('expire-check')
  @ApiOperation({ summary: 'Check and expire old subscriptions' })
  @ApiResponse({ status: 200, description: 'Expired subscriptions count' })
  async checkExpired() {
    const count = await this.subscriptionService.checkAndExpireSubscriptions();
    return { message: `${count} subscriptions expired`, count };
  }
}