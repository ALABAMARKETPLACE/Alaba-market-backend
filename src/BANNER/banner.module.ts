import { Module } from "@nestjs/common";
import { BannerController } from "./banner.controller";
import { BannerService } from "./banner.service";
import { BannerProviders } from "./banner.provider";
@Module({
	imports: [],
	controllers: [BannerController],
	providers: [BannerService, ...BannerProviders],
	exports: [BannerService],
})
export class BannerModule {}
