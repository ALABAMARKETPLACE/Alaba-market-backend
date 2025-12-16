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

import { Roles } from "./roles.entity";
import { CreateRolesDto } from "./dto/create.dto";
import { RolesService } from "./roles.services";
import { DataResponseDto } from "../shared/dto/data-response-dto";

@Controller("roles")
@ApiTags("roles")
export class RolesController {
  constructor(private readonly RolesService: RolesService) {}
}
