import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { SettingsProvider } from "./settings.provider";

@Module({
  imports: [],
  controllers: [SettingsController],
  providers: [SettingsService, ...SettingsProvider],
  exports: [SettingsService],
})
export class SettingsModule {}
