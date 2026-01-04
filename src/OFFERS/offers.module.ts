import { Module } from "@nestjs/common";
import { OffersController } from "./offers.controller";
import { OffersService } from "./offers.service";
import { SlugifyProvider } from "../shared/providers/slugify.provider";
import { SequelizeModule } from "@nestjs/sequelize";
import { Offers } from "./offers.entity";

@Module({
  imports: [SequelizeModule.forFeature([Offers])],
  controllers: [OffersController],
  providers: [OffersService, ...SlugifyProvider],
  exports: [OffersService],
})
export class OffersModule {}
