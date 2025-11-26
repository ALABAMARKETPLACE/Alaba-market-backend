// =====================================================
// FILE: backend/src/modules/drivers/dto/create-driver.dto.ts
// =====================================================
import { IsString, IsEmail, IsOptional, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty({ example: 'Michael Johnson' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Please provide a valid phone number' })
  phone: string;

  @ApiProperty({ example: 'driver@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'LIC123456', required: false })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiProperty({ example: 'ABC-123-DE', required: false })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;
}