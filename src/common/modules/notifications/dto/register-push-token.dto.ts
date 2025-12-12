import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterPushTokenDto {
  @ApiProperty({
    description: 'Expo push token',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Device type',
    example: 'android',
    enum: ['ios', 'android'],
  })
  @IsEnum(['ios', 'android'])
  @IsNotEmpty()
  deviceType: 'ios' | 'android';
}
