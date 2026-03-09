import { Module } from "@nestjs/common";
import { BannerController } from "./banner.controller";
import { BannerService } from "./banner.service";
import { BannerProviders } from "./banner.provider";
import { ImgcompressModule } from "../IMAGE_COMPRESS/img_compress.module";
@Module({
	imports: [ImgcompressModule],
	controllers: [BannerController],
	providers: [BannerService, ...BannerProviders],
	exports: [BannerService],
})
export class BannerModule {}
