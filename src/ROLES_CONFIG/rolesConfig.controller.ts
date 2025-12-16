import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";

import { RolesConfigService } from "./rolesConfig.services";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { RolesConfigDto } from "./dto/rolesConfig.dto";

@Controller("rolesConfig")
@ApiTags("rolesConfig")
export class RolesConfigController {
  constructor(private readonly rolesConfigService: RolesConfigService) {}
}
