import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from "@nestjs/common";
@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  constructor(private readonly MAX_SIZE: number = 5 * 1024 * 1024) {}
  async transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (value.size > this.MAX_SIZE) {
      throw new BadRequestException("File size exceeds the limit of 5 MB");
    }
    return value;
  }
}

export class FileSizeValidationPipeHighQuality implements PipeTransform {
  constructor(private readonly MAX_SIZE: number = 50 * 1024 * 1024) {}
  async transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (value.size > this.MAX_SIZE) {
      throw new BadRequestException("File size exceeds the limit of 50 MB");
    }
    return value;
  }
}

export class VideoSizeValidationPipe implements PipeTransform {
  constructor(private readonly MAX_SIZE: number = 50 * 1024 * 1024) {} // 50MB for videos
  async transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (value.size > this.MAX_SIZE) {
      throw new BadRequestException("Video file size exceeds the limit of 50 MB");
    }
    
    // Validate video file types
    const validVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validVideoTypes.includes(value.mimetype)) {
      throw new BadRequestException("Please upload a valid video file (MP4, MOV, AVI, WEBM)");
    }
    
    return value;
  }
}
