// src/modules/paystack/paystack.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { PaystackController } from './paystack.controller';
import { PaystackService } from './paystack.service';
import { Order } from '../orders/entities/order-entity';
import { Subscription } from '../subscription/entities/subscription.entity';

@Module({
  imports: [
    HttpModule,
    SequelizeModule.forFeature([Order, Subscription]),
  ],
  controllers: [PaystackController],
  providers: [PaystackService],
  exports: [PaystackService],
})
export class PaystackModule {}

// src/modules/paystack/dto/initialize-payment.dto.ts
import { IsString, IsNumber, IsEmail, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitializePaymentDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

export class SplitPaymentDto {
  @ApiProperty()
  @IsString()
  reference: string;

  @ApiProperty()
  @IsArray()
  subaccounts: Array<{
    subaccount: string;
    share: number;
  }>;
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  reference: string;
}
