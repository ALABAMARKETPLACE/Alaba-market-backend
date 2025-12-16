import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  UseGuards,
} from "@nestjs/common";
import { DistanceChargeService } from "./distancecharge.service";
import { DistanceChargeDto } from "./dto/distancecharge.dto";
import { CreateDistanceChargeDto } from "./dto/createDistanceCharge.dto";
import { UpdateDistanceChargeDto } from "./dto/updateDistanceCharge.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { Roles } from "../shared/decorator/roles.decorator";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Role } from "../shared/enum/role.enum";
import { UpsertDistanceChargeDto } from "./dto/upsertDistanceharge.dto";

@Controller("distancecharge")
@ApiTags("distancecharge")
export class DistanceChargeController {
  constructor(private readonly distanceChargeService: DistanceChargeService) {}

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiDataArrayResponse(DistanceChargeDto)
  findAll(): Promise<DataResponseDto> {
    return this.distanceChargeService.findAll();
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post()
  @ApiDataObjectResponse(DistanceChargeDto)
  @HttpCode(200)
  @ApiBearerAuth()
  create(@Body() create: CreateDistanceChargeDto[]): Promise<DataResponseDto> {
    return this.distanceChargeService.create(create);
  }
  // if id is present update else create
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post("upsert")
  @ApiDataObjectResponse(DistanceChargeDto)
  @HttpCode(201)
  @ApiBearerAuth()
  upsertCharge(
    @Body() body: UpsertDistanceChargeDto
  ): Promise<DataResponseDto> {
    return this.distanceChargeService.upsertCharge(body);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put()
  @ApiDataObjectResponse(DistanceChargeDto)
  @ApiBearerAuth()
  update(@Body() updates: UpdateDistanceChargeDto[]): Promise<DataResponseDto> {
    return this.distanceChargeService.update(updates);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiDataObjectResponse(DistanceChargeDto)
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.distanceChargeService.delete(id);
  }
}
