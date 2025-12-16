import { Module } from "@nestjs/common";
import { CountriesService } from "./countries.service";
import { CountriesProviders } from "./countries.provider";
import { CountriesController } from "./countries.controller";

@Module({
  imports: [],
  controllers: [CountriesController],
  providers: [CountriesService, ...CountriesProviders],
  exports: [CountriesService],
})
export class CountriesModule {}
