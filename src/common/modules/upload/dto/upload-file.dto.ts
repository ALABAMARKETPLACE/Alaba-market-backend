import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'File to upload' })
  file: any;

  @ApiPropertyOptional({ description: 'Entity type (e.g., product, user, order)', example: 'product' })
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  entityId?: string;

  @ApiPropertyOptional({ description: 'Is file public', example: true })
  isPublic?: boolean;
}