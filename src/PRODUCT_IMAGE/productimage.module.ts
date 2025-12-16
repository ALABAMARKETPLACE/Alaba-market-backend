import { Module } from "@nestjs/common";
import { ProductImageController } from "./productimage.controller";
import { ProductImageService } from "./productimage.service";
import { ProductImageProvider } from "./productimage.provider";
import { ImgcompressModule } from "../IMAGE_COMPRESS/img_compress.module";

@Module({
  imports: [ImgcompressModule],
  controllers: [ProductImageController],
  providers: [ProductImageService, ...ProductImageProvider],
  exports: [ProductImageService],
})
export class ProductImageModule {}
