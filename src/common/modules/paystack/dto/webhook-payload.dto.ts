// backend/src/modules/paystack/dto/webhook-payload.dto.ts
import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WebhookPayloadDto {
  @ApiProperty()
  @IsString()
  event: string;

  @ApiProperty()
  @IsObject()
  data: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  signature?: string;
}