import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty({ required: false })
  actionUrl?: string;

  @ApiProperty({ required: false })
  data?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
