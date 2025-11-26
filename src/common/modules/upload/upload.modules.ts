
// src/upload/upload.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Upload } from './entities/upload.entity';

@Module({
  imports: [SequelizeModule.forFeature([Upload])],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}