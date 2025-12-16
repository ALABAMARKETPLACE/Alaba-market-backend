import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { RRole } from "../shared/decorator/role_decorator";
import { OrderStatisticsDto } from "./dto/statistics.dto";

@Controller("dashboard")
@ApiTags("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Get("count")
  getCounts(@StoreId() storeId: number, @RRole() role: string) {
    return this.service.getCount(storeId, role);
  }

  @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Get("statistics")
  getStatistics(@StoreId() storeId: number, @RRole() role: string) {
    return this.service.getStatistics(storeId, role);
  }

  @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Get("order_statistics")
  orderStatistics(
    @StoreId() storeId: number,
    @RRole() role: string,
    @Query() query: OrderStatisticsDto
  ) {
    return this.service.getOrderStatistics(storeId, role,query);
  }
}
