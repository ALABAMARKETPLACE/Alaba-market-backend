import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Put,
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
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { SettingsService } from "./settings.service";
import { SettingsDto } from "./dto/settings.dto";
import { UpdateSettingsDto } from "./dto/updateSettings.dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { SettingsCacheInterceptor } from "../shared/interceptor/settings.cache.interceptor";

@Controller("settings")
@ApiTags("settings")
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Get()
  @UseInterceptors(SettingsCacheInterceptor)
  @ApiOkResponse({ type: [SettingsDto] })
  async findAll(): Promise<DataResponseDto> {
    return this.settingsService.findAll();
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put(":id")
  @ApiOkResponse({ type: SettingsDto })
  @ApiParam({ name: "id", required: true })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  update(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() update: UpdateSettingsDto
  ): Promise<DataResponseDto> {
    return this.settingsService.update(id, update);
  }
}
