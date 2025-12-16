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
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { NewDistanceCharge } from "./newdistancecharge.entity";
import { NewDistanceChargeDto } from "./dto/newdistancecharge.dto";
import { NewDistanceChargeService } from "./newdistancecharge.service";
import { CreateNewDistanceChargeDto } from "./dto/create.dto";
import { UpdateNewDistanceChargeDto } from "./dto/update.dto";
import { GetAllNewDistanceChargeDto } from "./dto/getAll.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";

@Controller("new-distance-charge")
@ApiTags("new-distance-charge")
export class NewDistanceChargeController {
  constructor(
    private readonly newDistanceChargeService: NewDistanceChargeService
  ) {}

  // Get all with pagination and search
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get()
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ type: [NewDistanceChargeDto] })
  @UsePipes(new ValidationPipe({ transform: true }))
  findAll(
    @Query() params: GetAllNewDistanceChargeDto
  ): Promise<DataResponseDto> {
    return this.newDistanceChargeService.findAll(params);
  }

  // Get one by ID
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get(":id")
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiParam({ name: "id", required: true })
  @ApiOkResponse({ type: NewDistanceChargeDto })
  findOne(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.newDistanceChargeService.findOne(id);
  }

  // Create new
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post()
  @ApiCreatedResponse({ type: NewDistanceCharge })
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @Body() createDto: CreateNewDistanceChargeDto
  ): Promise<DataResponseDto> {
    return this.newDistanceChargeService.create(createDto);
  }

  // Update
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put(":id")
  @ApiOkResponse({ type: NewDistanceCharge })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @HttpCode(200)
  update(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() body: UpdateNewDistanceChargeDto
  ): Promise<DataResponseDto> {
    return this.newDistanceChargeService.update(id, body);
  }

  // Delete (soft delete)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiOkResponse({ type: NewDistanceCharge })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @HttpCode(200)
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.newDistanceChargeService.delete(id);
  }
}
