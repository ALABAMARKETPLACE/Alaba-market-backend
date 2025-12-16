import { Module } from "@nestjs/common";
import { OffersController } from "./offers.controller";
import { OffersService } from "./offers.service";
import { OffersProvider } from "./offers.provider";
import { SlugifyProvider } from "../shared/providers/slugify.provider";

@Module({
  imports: [],
  controllers: [OffersController],
  providers: [OffersService, ...OffersProvider, ...SlugifyProvider],
  exports: [OffersService],
})
export class OffersModule {}
