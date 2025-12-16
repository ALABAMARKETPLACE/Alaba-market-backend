import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ImgcompressService } from "./img_compress.service";
import { ImageMimetypeValidationPipe } from "../shared/pipes/validate_img.pipe";
import {
  FileSizeValidationPipe,
  FileSizeValidationPipeHighQuality,
  VideoSizeValidationPipe,
} from "../shared/pipes/file_size.pipe";

@Controller("img_compress")
@ApiTags("img_compress")
export class ImgcompressController {
  constructor(private readonly imgcompressService: ImgcompressService) {}

  @Post("compress")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile(
      // new ImageMimetypeValidationPipe(),
      new FileSizeValidationPipe()
    )
    file: Express.Multer.File
  ) {
    return await this.imgcompressService.imgCompressAndUpload(file);
  }

  @Post("file")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFileToS3(
    @UploadedFile(new FileSizeValidationPipe()) file: Express.Multer.File
  ) {
    return await this.imgcompressService.uploadToS3(file);
  }

  @Post("file/both")
  @UseInterceptors(FilesInterceptor("file", 10)) // Allow up to 10 files, adjust as needed
  async uploadMultipleColorAndBWToS3(
    @UploadedFiles(new FileSizeValidationPipeHighQuality())
    files: Express.Multer.File[]
  ) {
    return await this.imgcompressService.uploadMultipleColorAndBWToS3(files);
  }

  @Post("video")
  @UseInterceptors(FileInterceptor("file"))
  async uploadVideoToS3(
    @UploadedFile(new VideoSizeValidationPipe()) file: Express.Multer.File
  ) {
    const videoUrl = await this.imgcompressService.uploadToS3(file);
    return {
      url: videoUrl,
      Location: videoUrl,
      status: true,
      message: "Video uploaded successfully"
    };
  }
}
