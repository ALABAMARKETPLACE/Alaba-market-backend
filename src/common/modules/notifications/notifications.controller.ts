import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { seedTestNotifications, clearTestNotifications } from './seed-notifications';
import { Public } from '../../decorators/public.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved',
    type: [NotificationResponseDto],
  })
  async getNotifications(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isRead') isRead?: boolean,
    @Query('type') type?: string,
  ) {
    const result = await this.notificationsService.findAll(
      req.user.id,
      page ? +page : 1,
      limit ? +limit : 20,
      isRead,
      type,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount(@Req() req: any) {
    const result = await this.notificationsService.getUnreadCount(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single notification' })
  @ApiResponse({ status: 200, description: 'Notification found', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async getNotification(@Req() req: any, @Param('id') id: string) {
    const notification = await this.notificationsService.findOne(id, req.user.id);

    if (!notification) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }

    return {
      success: true,
      data: notification,
    };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const notification = await this.notificationsService.markAsRead(id, req.user.id);
    return {
      success: true,
      data: notification,
    };
  }

  @Put('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: any) {
    const result = await this.notificationsService.markAllAsRead(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('mark-multiple-read')
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  async markMultipleAsRead(@Req() req: any, @Body() body: { notificationIds: string[] }) {
    const result = await this.notificationsService.markMultipleAsRead(
      body.notificationIds,
      req.user.id,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(@Req() req: any, @Param('id') id: string) {
    const result = await this.notificationsService.delete(id, req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('delete-multiple')
  @ApiOperation({ summary: 'Delete multiple notifications' })
  @ApiResponse({ status: 200, description: 'Notifications deleted' })
  async deleteMultiple(@Req() req: any, @Body() body: { notificationIds: string[] }) {
    const result = await this.notificationsService.deleteMultiple(
      body.notificationIds,
      req.user.id,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Delete('clear-all')
  @ApiOperation({ summary: 'Clear all notifications' })
  @ApiResponse({ status: 200, description: 'All notifications cleared' })
  async clearAll(@Req() req: any) {
    const result = await this.notificationsService.clearAll(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('register-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register push notification token' })
  async registerPushToken(@Request() req, @Body() dto: RegisterPushTokenDto) {
    const userId = req.user.sub || req.user.id; // Adjust based on your JWT payload
    return this.notificationsService.registerPushToken(userId, dto);
  }

  @Delete('unregister-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister push notification token' })
  async unregisterPushToken(@Request() req, @Body() body?: { token?: string }) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.unregisterPushToken(userId, body?.token);
  }

  @Post('test-push')
  @UseGuards(JwtAuthGuard)
  async testPushNotification(@Request() req) {
    const userId = req.user.sub || req.user.id;

    await this.notificationsService.sendPushNotification(
      userId,
      'Test Notification',
      'This is a test push notification! 🎉',
      { test: true },
    );

    return { success: true, message: 'Test notification sent' };
  }

  @Post('seed/:userId')
  @Public()
  @ApiOperation({ summary: 'Seed test notifications for specific user (testing only)' })
  @ApiResponse({ status: 201, description: 'Test notifications created' })
  async seedTestDataForUser(@Param('userId') userId: string) {
    try {
      const result = await seedTestNotifications(userId);
      return {
        success: true,
        message: `Test notifications seeded successfully for user ${userId}`,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to seed notifications',
      };
    }
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed test notifications for authenticated user' })
  @ApiResponse({ status: 201, description: 'Test notifications created' })
  async seedTestData(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    await seedTestNotifications(userId);
    return {
      success: true,
      message: 'Test notifications seeded successfully',
    };
  }

  @Delete('clear')
  @Public()
  @ApiOperation({ summary: 'Clear all test notifications' })
  @ApiResponse({ status: 200, description: 'Test notifications cleared' })
  async clearTestData(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return {
        success: false,
        message: 'User ID not found',
      };
    }
    await clearTestNotifications(userId);
    return {
      success: true,
      message: 'Test notifications cleared successfully',
    };
  }
}
