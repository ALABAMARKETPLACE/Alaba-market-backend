import { PartialType } from '@nestjs/swagger';
import { CreateUploadDto } from './create-upload.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUploadDto extends PartialType(CreateUploadDto) {
  @ApiPropertyOptional({ description: 'Mark as deleted', example: false })
  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;
}

// src/upload/dto/upload-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  url: string;

  @ApiProperty()
  s3Key: string;

  @ApiProperty()
  s3Bucket: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty()
  metadata: object;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}