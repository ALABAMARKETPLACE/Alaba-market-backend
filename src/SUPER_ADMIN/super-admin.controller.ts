import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Roles } from "../shared/decorator/roles.decorator";
import { UserId } from "../shared/decorator/userId_decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { CreateBoosterPlanConfigDto } from "./dto/create-booster-plan-config.dto";
import { UpdateBoosterPlanConfigDto } from "./dto/update-booster-plan-config.dto";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { SuperAdminService } from "./super-admin.service";

@Controller("super-admin")
@ApiTags("super-admin")
@ApiBearerAuth()
@Roles(Role.SuperAdmin)
@UseGuards(AuthGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Post("booster-plan-configs")
  @HttpCode(201)
  @ApiOperation({ summary: "Create booster plan config" })
  createBoosterPlanConfig(
    @UserId() actorId: number,
    @Req() req: any,
    @Body() payload: CreateBoosterPlanConfigDto,
  ): Promise<DataResponseDto> {
    return this.superAdminService.createBoosterPlanConfig(
      this.actor(actorId, req),
      payload,
    );
  }

  @Get("booster-plan-configs")
  @HttpCode(200)
  @ApiOperation({ summary: "List booster plan configs" })
  listBoosterPlanConfigs(
    @UserId() actorId: number,
    @Req() req: any,
  ): Promise<DataResponseDto> {
    return this.superAdminService.listBoosterPlanConfigs(
      this.actor(actorId, req),
    );
  }

  @Patch("booster-plan-configs/:id")
  @HttpCode(200)
  @ApiOperation({ summary: "Update booster plan config" })
  updateBoosterPlanConfig(
    @UserId() actorId: number,
    @Req() req: any,
    @Param("id") id: string,
    @Body() payload: UpdateBoosterPlanConfigDto,
  ): Promise<DataResponseDto> {
    return this.superAdminService.updateBoosterPlanConfig(
      this.actor(actorId, req),
      Number(id),
      payload,
    );
  }

  @Patch("booster-plan-configs/:id/disable")
  @HttpCode(200)
  @ApiOperation({ summary: "Disable booster plan config" })
  disableBoosterPlanConfig(
    @UserId() actorId: number,
    @Req() req: any,
    @Param("id") id: string,
  ): Promise<DataResponseDto> {
    return this.superAdminService.setBoosterPlanConfigActive(
      this.actor(actorId, req),
      Number(id),
      false,
    );
  }

  @Patch("booster-plan-configs/:id/enable")
  @HttpCode(200)
  @ApiOperation({ summary: "Enable booster plan config" })
  enableBoosterPlanConfig(
    @UserId() actorId: number,
    @Req() req: any,
    @Param("id") id: string,
  ): Promise<DataResponseDto> {
    return this.superAdminService.setBoosterPlanConfigActive(
      this.actor(actorId, req),
      Number(id),
      true,
    );
  }

  @Get("users")
  @HttpCode(200)
  @ApiOperation({ summary: "List users" })
  listUsers(
    @UserId() actorId: number,
    @Req() req: any,
  ): Promise<DataResponseDto> {
    return this.superAdminService.listUsers(this.actor(actorId, req));
  }

  @Get("admins")
  @HttpCode(200)
  @ApiOperation({ summary: "List admins" })
  listAdmins(
    @UserId() actorId: number,
    @Req() req: any,
  ): Promise<DataResponseDto> {
    return this.superAdminService.listAdmins(this.actor(actorId, req));
  }

  @Patch("users/:id/role")
  @HttpCode(200)
  @ApiOperation({ summary: "Update user role" })
  updateUserRole(
    @UserId() actorId: number,
    @Req() req: any,
    @Param("id") id: string,
    @Body() payload: UpdateUserRoleDto,
  ): Promise<DataResponseDto> {
    return this.superAdminService.updateUserRole(
      this.actor(actorId, req),
      Number(id),
      payload,
    );
  }

  @Patch("users/:id/status")
  @HttpCode(200)
  @ApiOperation({ summary: "Update user status" })
  updateUserStatus(
    @UserId() actorId: number,
    @Req() req: any,
    @Param("id") id: string,
    @Body() payload: UpdateUserStatusDto,
  ): Promise<DataResponseDto> {
    return this.superAdminService.updateUserStatus(
      this.actor(actorId, req),
      Number(id),
      payload,
    );
  }

  private actor(actorId: number, req: any) {
    return {
      actorId,
      actorRole: req?.user?.role,
      ipAddress:
        String(req?.headers?.["x-forwarded-for"] || "")
          .split(",")[0]
          .trim() ||
        req?.ip ||
        req?.socket?.remoteAddress ||
        null,
    };
  }
}
