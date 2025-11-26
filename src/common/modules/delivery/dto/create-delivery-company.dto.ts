// src/modules/delivery-company/dto/create-delivery-company.dto.ts
import { IsString, IsArray, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeliveryCompanyDto {
  @ApiProperty()
  @IsString()
  companyName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  routes: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  registrationNumber?: string;
}

export class UpdateDeliveryCompanyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  routes?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  logo?: string;
}

export class ConfirmPackageDto {
  @ApiProperty()
  @IsString()
  barcodeShortCode: string;

  @ApiProperty()
  @IsString()
  packagePhoto: string;
}