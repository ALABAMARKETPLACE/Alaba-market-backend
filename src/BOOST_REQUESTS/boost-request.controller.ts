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
} from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { BoostRequestService } from "./boost-request.service";
import { BoostRequestDto } from "./dto/boost-request.dto";
import { CreateBoostRequestDto } from "./dto/create-boost-request.dto";
import { UpdateBoostRequestDto } from "./dto/update-boost-request.dto";
import { GetAllBoostRequestsDto } from "./dto/get-all-boost-requests.dto";
import { ApproveBoostRequestDto } from "./dto/approve-boost-request.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { Roles } from "../shared/decorator/roles.decorator";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Role } from "../shared/enum/role.enum";
import { UserId } from "../shared/decorator/userId_decorator";
import { UserRole } from "../shared/decorator/userRole_decorator";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { UpdateBoostPriorityDto } from "./dto/update-boost-priority.dto";

@Controller("boost-requests")
@ApiTags("boost-requests")
export class BoostRequestController {
  constructor(private readonly boostRequestService: BoostRequestService) {}

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiDataObjectResponse(BoostRequestDto)
  findAll(@Query() query: GetAllBoostRequestsDto): Promise<DataResponseDto> {
    return this.boostRequestService.findAll(query);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("active")
  @ApiBearerAuth()
  @ApiDataArrayResponse(BoostRequestDto)
  @HttpCode(200)
  findActive(): Promise<DataResponseDto> {
    return this.boostRequestService.findActive();
  }

  @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Get(":id")
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @ApiDataObjectResponse(BoostRequestDto)
  findOne(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.boostRequestService.findOne(id);
  }

  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Post()
  @ApiDataObjectResponse(BoostRequestDto)
  @HttpCode(201)
  @ApiBearerAuth()
  create(@Body() createDto: CreateBoostRequestDto): Promise<DataResponseDto> {
    // Frontend must send seller_id in the body
    return this.boostRequestService.create(createDto.seller_id, createDto);
  }

  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Put()
  @ApiDataObjectResponse(BoostRequestDto)
  @ApiBearerAuth()
  update(@Body() updateDto: UpdateBoostRequestDto): Promise<DataResponseDto> {
    // Frontend must send seller_id in the body
    return this.boostRequestService.update(updateDto.seller_id, updateDto);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiDataObjectResponse(BoostRequestDto)
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.boostRequestService.delete(id);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post("approve")
  @ApiDataObjectResponse(BoostRequestDto)
  @HttpCode(200)
  @ApiBearerAuth()
  approve(
    @Body() approveDto: ApproveBoostRequestDto,
    @UserId() adminId: number
  ): Promise<DataResponseDto> {
    return this.boostRequestService.approve(adminId, approveDto);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put("priority")
  @ApiBearerAuth()
  @ApiDataObjectResponse(BoostRequestDto)
  @HttpCode(200)
  updatePriority(
    @Body() body: UpdateBoostPriorityDto,
    @UserId() adminId: number
  ): Promise<DataResponseDto> {
    return this.boostRequestService.updatePriority(adminId, body);
  }
}
