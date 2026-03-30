import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { UserId } from "../shared/decorator/userId_decorator";
import { StoreService } from "../STORE/store.service";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { RemovePasswordInterceptor } from "../shared/interceptor/remove-password.interceptor";
import { UserService } from "./user.services";
import { SwitchActiveRoleDto } from "./dto/switch-active-role.dto";
import { Fid } from "../shared/decorator/fid.decorator";
import { AssignAdminRoleDto } from "./dto/assign-admin-role.dto";
import { UpgradeToSellerDto } from "../STORE/dto/upgradeToSeller.dto";
import { SendAdminInviteDto } from "./dto/send-admin-invite.dto";
import { AcceptAdminInviteDto } from "./dto/accept-admin-invite.dto";
import { Public } from "../shared/decorator/optional.decorator";

@Controller("users")
@ApiTags("users")
export class UsersManagementController {
  constructor(
    private readonly userService: UserService,
    private readonly storeService: StoreService,
  ) {}

  @UseGuards(AuthGuard)
  @Post("upgrade-to-seller")
  @ApiBearerAuth()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiOkResponse({ type: DataResponseDto })
  upgradeToSeller(
    @UserId() userId: number,
    @Body() payload: UpgradeToSellerDto,
  ): Promise<DataResponseDto> {
    return this.storeService.upgradeUserToSeller(userId, payload);
  }

  @UseGuards(AuthGuard)
  @Post("downgrade-to-buyer")
  @ApiBearerAuth()
  @HttpCode(200)
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiOkResponse({ type: DataResponseDto })
  downgradeToBuyer(@UserId() userId: number): Promise<DataResponseDto> {
    return this.storeService.downgradeUserToBuyer(userId);
  }

  @UseGuards(AuthGuard)
  @Patch("me/active-role")
  @ApiBearerAuth()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiOkResponse({ type: DataResponseDto })
  switchActiveRole(
    @UserId() userId: number,
    @Fid() fid: number,
    @Body() payload: SwitchActiveRoleDto,
  ): Promise<DataResponseDto> {
    return this.userService.switchActiveRole(userId, payload.role, fid);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Patch(":id/disable")
  @ApiBearerAuth()
  @HttpCode(200)
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "id", required: true })
  disableUser(
    @Param("id", ParseIntPipe) userId: number,
  ): Promise<DataResponseDto> {
    return this.userService.disableUserAccount(userId);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Patch(":id/enable")
  @ApiBearerAuth()
  @HttpCode(200)
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "id", required: true })
  enableUser(
    @Param("id", ParseIntPipe) userId: number,
  ): Promise<DataResponseDto> {
    return this.userService.enableUserAccount(userId);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiBearerAuth()
  @HttpCode(200)
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "id", required: true })
  softDeleteUser(
    @Param("id", ParseIntPipe) userId: number,
  ): Promise<DataResponseDto> {
    return this.userService.softDeleteUser(userId);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post("admin-invite")
  @ApiBearerAuth()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOkResponse({ type: DataResponseDto })
  sendAdminInvite(
    @UserId() inviterId: number,
    @Body() payload: SendAdminInviteDto,
  ): Promise<DataResponseDto> {
    return this.userService.sendAdminInvite(inviterId, payload);
  }

  @Public()
  @Post("admin-invite/accept")
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiOkResponse({ type: DataResponseDto })
  acceptAdminInvite(
    @Body() payload: AcceptAdminInviteDto,
  ): Promise<DataResponseDto> {
    return this.userService.acceptAdminInvite(payload);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Patch(":id/assign-admin")
  @ApiBearerAuth()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "id", required: true })
  assignAdminRole(
    @Param("id", ParseIntPipe) userId: number,
    @Body() payload: AssignAdminRoleDto,
  ): Promise<DataResponseDto> {
    return this.userService.assignAdminRole(
      userId,
      payload.make_active_role ?? false,
    );
  }
}
