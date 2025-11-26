// src/subscription/dto/update-subscription.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateSubscriptionDto } from './create-subscription.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {
  @ApiPropertyOptional({ 
    description: 'Subscription status', 
    enum: ['active', 'cancelled', 'expired', 'suspended'],
    example: 'active'
  })
  @IsEnum(['active', 'cancelled', 'expired', 'suspended'])
  @IsOptional()
  status?: string;
}

