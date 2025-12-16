import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";

import { StatesService } from "./states.service";
import { StatesDto } from "./dto/states.dto";
import { CreateStatesDto } from "./dto/createStates.dto";
import { UpdateStatesDto } from "./dto/updateStates.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";


@Controller("states")
@ApiTags("states")
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  @Get()
  @ApiBearerAuth()
  @ApiDataArrayResponse(StatesDto)
  findAll(): Promise<DataResponseDto> {
    return this.statesService.findAll();
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post()
  @ApiDataObjectResponse(StatesDto)
  @HttpCode(200)
  @ApiBearerAuth()
  create(@Body() create: CreateStatesDto): Promise<DataResponseDto> {
    return this.statesService.create(create);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put(":id")
  @ApiDataObjectResponse(StatesDto)
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  update(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() update: UpdateStatesDto
  ): Promise<DataResponseDto> {
    return this.statesService.update(id, update);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiDataObjectResponse(StatesDto)
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.statesService.delete(id);
  }
}
