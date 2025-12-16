import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { dashboardProvider } from "./dashboard.provider";

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, ...dashboardProvider],
})
export class DashboardModule {}
