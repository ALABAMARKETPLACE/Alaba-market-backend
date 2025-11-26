// src/upload/upload.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { UploadResponseDto } from './dto/upload-response.dto';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', type: UploadResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId?: string,
    @Body('entityType') entityType?: string,
    @Body('entityId') entityId?: string,
    @Body('isPublic') isPublic?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const upload = await this.uploadService.uploadFile(
      file,
      userId,
      entityType,
      entityId,
      isPublic === 'true',
    );
    return { success: true, data: upload };
  }

  @Post('files')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded successfully', type: [UploadResponseDto] })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('userId') userId?: string,
    @Body('entityType') entityType?: string,
    @Body('entityId') entityId?: string,
    @Body('isPublic') isPublic?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    const uploads = await this.uploadService.uploadMultipleFiles(
      files,
      userId,
      entityType,
      entityId,
      isPublic === 'true',
    );
    return { success: true, data: uploads };
  }

  @Get()
  @ApiOperation({ summary: 'Get all uploads' })
  @ApiResponse({ status: 200, description: 'List of all uploads', type: [UploadResponseDto] })
  async findAll() {
    const items = await this.uploadService.findAll();
    return { success: true, data: items };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get uploads by user ID' })
  @ApiResponse({ status: 200, description: 'User uploads', type: [UploadResponseDto] })
  async findByUserId(@Param('userId') userId: string) {
    const items = await this.uploadService.findByUserId(userId);
    return { success: true, data: items };
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get uploads by entity' })
  @ApiResponse({ status: 200, description: 'Entity uploads', type: [UploadResponseDto] })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const items = await this.uploadService.findByEntity(entityType, entityId);
    return { success: true, data: items };
  }

  @Get('type/:fileType')
  @ApiOperation({ summary: 'Get uploads by file type' })
  @ApiResponse({ status: 200, description: 'Uploads of specified type', type: [UploadResponseDto] })
  async findByFileType(@Param('fileType') fileType: string) {
    const items = await this.uploadService.findByFileType(fileType);
    return { success: true, data: items };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an upload by ID' })
  @ApiResponse({ status: 200, description: 'Upload details', type: UploadResponseDto })
  @ApiResponse({ status: 404, description: 'Upload not found' })
  async findOne(@Param('id') id: string) {
    const upload = await this.uploadService.findOne(id);
    return { success: true, data: upload };
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Get refreshed signed URL for an upload' })
  @ApiResponse({ status: 200, description: 'Signed URL' })
  async getRefreshedUrl(@Param('id') id: string) {
    const url = await this.uploadService.getRefreshedUrl(id);
    return { success: true, data: { url } };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an upload' })
  @ApiResponse({ status: 200, description: 'Upload updated successfully', type: UploadResponseDto })
  @ApiResponse({ status: 404, description: 'Upload not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUploadDto: UpdateUploadDto,
  ) {
    const upload = await this.uploadService.update(id, updateUploadDto);
    return { success: true, data: upload };
  }

  @Delete(':id/soft')
  @ApiOperation({ summary: 'Soft delete an upload' })
  @ApiResponse({ status: 200, description: 'Upload soft deleted successfully' })
  async softDelete(@Param('id') id: string) {
    await this.uploadService.softDelete(id);
    return { success: true, data: null, message: 'Upload soft deleted successfully' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete an upload' })
  @ApiResponse({ status: 200, description: 'Upload deleted successfully' })
  @ApiResponse({ status: 404, description: 'Upload not found' })
  async remove(@Param('id') id: string) {
    await this.uploadService.remove(id);
    return { success: true, data: null, message: 'Upload deleted successfully' };
  }
}