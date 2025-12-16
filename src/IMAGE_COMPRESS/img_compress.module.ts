import { Module } from "@nestjs/common";
import { ImgcompressController } from "./img_compress.controller";
import { ImgcompressService } from "./img_compress.service";
@Module({
	imports: [],
	controllers: [ImgcompressController],
	providers: [ImgcompressService],
	exports: [ImgcompressService],
})
export class ImgcompressModule {}
