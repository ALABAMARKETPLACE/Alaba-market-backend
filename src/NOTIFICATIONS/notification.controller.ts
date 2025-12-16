import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { AuthGuard } from "../shared/guards/auth.guard";
import { UserId } from "../shared/decorator/userId_decorator";
import { NotificationsService } from "./notification.service";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { ApiPaginatedResponse } from "../shared/decorator/dto-paginated.decorator";
import { NotificationsModal } from "./notification.entity";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";

@Controller("notifications")
@ApiTags("notifications")
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}
  // @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiDataObjectResponse(NotificationsModal)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiParam({ name: "token", required: true })
  @Get("test/:token")
  Test(@Param("token") token: string) {
    return this.notificationService.Test(token);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiPaginatedResponse(NotificationsModal)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("all")
  findAll(@UserId() userId: number, @Query() pageOptions: PageOptionsDto) {
    return this.notificationService.findAll(userId, pageOptions);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationsModal })
  @ApiParam({ name: "id", required: true })
  @Patch("read/:id")
  markRead(@UserId() userId: number, @Param("id") id: number) {
    return this.notificationService.markAsRead(Number(id), userId);
  }
}
