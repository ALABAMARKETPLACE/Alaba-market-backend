// src/upload/dto/create-upload.dto.ts
import { IsUUID, IsOptional, IsEnum, IsString, IsNumber, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUploadDto {
  @ApiPropertyOptional({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'File name', example: 'product-image-1234.jpg' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'Original file name', example: 'my-product.jpg' })
  @IsString()
  originalName: string;

  @ApiProperty({ description: 'MIME type', example: 'image/jpeg' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes', example: 2048576 })
  @IsNumber()
  size: number;

  @ApiProperty({ description: 'File URL', example: 'https://s3.amazonaws.com/bucket/file.jpg' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'S3 key' })
  @IsString()
  @IsOptional()
  s3Key?: string;

  @ApiPropertyOptional({ description: 'S3 bucket name' })
  @IsString()
  @IsOptional()
  s3Bucket?: string;

  @ApiProperty({ 
    description: 'File type', 
    enum: ['image', 'document', 'video', 'audio', 'other'],
    example: 'image'
  })
  @IsEnum(['image', 'document', 'video', 'audio', 'other'])
  fileType: string;

  @ApiPropertyOptional({ description: 'Entity type (e.g., product, user, order)', example: 'product' })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { width: 1920, height: 1080, format: 'jpeg' }
  })
  @IsObject()
  @IsOptional()
  metadata?: object;

  @ApiPropertyOptional({ description: 'Is file public', example: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
