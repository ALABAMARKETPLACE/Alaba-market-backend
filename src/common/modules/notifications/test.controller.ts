import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { seedTestNotifications, clearTestNotifications } from '../notifications/seed-notifications';

@ApiTags('Testing')
@Controller('test')
export class TestController {
  @Post('seed-notifications/:userId')
  @ApiOperation({ summary: 'Seed test notifications for a user (no auth required)' })
  @ApiResponse({ status: 201, description: 'Test notifications created' })
  async seedNotifications(@Param('userId') userId: string) {
    try {
      const result = await seedTestNotifications(userId);
      return {
        success: true,
        message: `✅ Successfully seeded ${result.count} notifications for user ${userId}`,
        data: {
          total: result.count,
          unread: result.unreadCount,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `❌ Failed to seed notifications: ${error.message}`,
      };
    }
  }

  @Post('clear-notifications/:userId')
  @ApiOperation({ summary: 'Clear all notifications for a user (no auth required)' })
  @ApiResponse({ status: 200, description: 'Notifications cleared' })
  async clearNotifications(@Param('userId') userId: string) {
    try {
      const result = await clearTestNotifications(userId);
      return {
        success: true,
        message: `🗑️ Cleared ${result.deletedCount} notifications for user ${userId}`,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `❌ Failed to clear notifications: ${error.message}`,
      };
    }
  }
}
