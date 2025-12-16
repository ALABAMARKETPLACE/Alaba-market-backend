import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";

import { Menus } from "./menus.entity";
import { MenusDto } from "./dto/menus.dto";
import { CreateMenusDto } from "./dto/create.dto";
import { MenusService } from "./menus.services";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";

@Controller("menus")
@ApiTags("menus")
export class MenusController {
  constructor(private readonly MenusService: MenusService) {}
}
