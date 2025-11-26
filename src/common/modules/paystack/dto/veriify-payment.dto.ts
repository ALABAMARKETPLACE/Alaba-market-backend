import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ 
    description: 'Payment reference to verify', 
    example: 'TXN_123456789' 
  })
  @IsString()
  reference: string;
}
