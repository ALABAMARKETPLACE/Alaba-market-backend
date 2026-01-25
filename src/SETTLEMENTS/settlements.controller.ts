import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { Roles } from "../shared/decorator/roles.decorator";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { CreateSettlementsDto } from "./dto/createSettlements.dto";
import { SettlementsQueryDto } from "./dto/queryDto.dto";
import { SettlementsDto } from "./dto/settlements.dto";
import { SettlementsService } from "./settlements.service";

@Controller("settlements")
@ApiTags("settlements")
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  //to get settlements summary for a seller
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Get("summary")
  @HttpCode(200)
  getSummary(@Req() req: any) {
    return this.settlementsService.findSummary({
      storeId: req.user.storeId,
    });
  }

  //to get settlement history for a seller
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Get("history")
  @HttpCode(200)
  getHistory(
    @Req() req: any,
    @Query() pageOptions: SettlementsQueryDto
  ): Promise<DataResponseDto> {
    return this.settlementsService.findAll(req.user, pageOptions);
  }
  
  
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get("historyById/:id")
  @ApiParam({ name: "id", required: true })
  @ApiDataObjectResponse(SettlementsDto)
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  getHistoryById(
    @Param("id", ParseIntPipe) id: number
  ): Promise<DataResponseDto> {
    return this.settlementsService.findOneById(id);
  }

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get("allSettlementsByStore")
  @ApiDataObjectResponse(SettlementsDto)
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  getSettlementByStore(
    @StoreId() storeId: number,
    @Query() pageOptions: SettlementsQueryDto
  ): Promise<DataResponseDto> {
    return this.settlementsService.findAllSettlement(
      storeId,
      pageOptions,
      "store"
    );
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get("allSettlementsByAdmin")
  @ApiDataObjectResponse(SettlementsDto)
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  getSettlementAdmin(
    @StoreId() storeId: number,
    @Query() pageOptions: SettlementsQueryDto
  ): Promise<DataResponseDto> {
    return this.settlementsService.findAllSettlement(
      storeId,
      pageOptions,
      "admin"
    );
  }

  //to get settlement summary for admin for a seller
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("summary/:id")
  @ApiParam({ name: "id", required: true })
  @ApiDataObjectResponse(SettlementsDto)
  @HttpCode(200)
  getSummaryAdmin(
    @Param("id", new ParseIntPipe()) storeId: number
  ): Promise<DataResponseDto> {
    return this.settlementsService.findSummary({ storeId });
  }

  //to get settlement history of a store for admin
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("history/:id")
  @ApiDataObjectResponse(SettlementsDto)
  @ApiParam({ name: "id", required: true })
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  getHistoryAdmin(
    @Param("id", new ParseIntPipe()) storeId: number,
    @Query() pageOptions: SettlementsQueryDto
  ): Promise<DataResponseDto> {
    return this.settlementsService.findAll(storeId, pageOptions);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("details/:id")
  @ApiBearerAuth()
  @ApiParam({ name: "id", required: true })
  @ApiDataArrayResponse(SettlementsDto)
  getDetails(@Param("id") storeId: number): Promise<DataResponseDto> {
    return this.settlementsService.getSettlementDetails(storeId);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("store/:id")
  @ApiBearerAuth()
  @ApiParam({ name: "id", required: true })
  @ApiDataArrayResponse(SettlementsDto)
  getSettlements(@Param("id") storeId: number): Promise<DataResponseDto> {
    return this.settlementsService.getOrderDetailsForStore(storeId);
  }

  //to update the settlement status
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Put("update/:id")
  @ApiParam({ name: "id", required: true })
  @ApiDataObjectResponse(SettlementsDto)
  @HttpCode(201)
  @ApiBearerAuth()
  update(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.settlementsService.updatePaymentStatus(id);
  }

  @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Put("updateStatus/:id/:type")
  @ApiParam({ name: "id", required: true })
  @ApiParam({ name: "type", required: true })
  @ApiDataObjectResponse(SettlementsDto)
  @HttpCode(201)
  @ApiBearerAuth()
  updateStatus(
    @Param("id", new ParseIntPipe()) id: number,
    @Param("type") type: string
  ): Promise<DataResponseDto> {
    return this.settlementsService.updateRequestedStatus(id, type);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post("create")
  @ApiDataObjectResponse(SettlementsDto)
  @HttpCode(201)
  @ApiBearerAuth()
  create(@Body() create: CreateSettlementsDto): Promise<DataResponseDto> {
    return this.settlementsService.create(create);
  }

  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Post("createByStore")
  @ApiDataObjectResponse(SettlementsDto)
  @HttpCode(201)
  @ApiBearerAuth()
  createStore(
    @StoreId() storeId: number,
    @Body() create: CreateSettlementsDto
  ): Promise<DataResponseDto> {
    return this.settlementsService.createByStore(storeId, create);
  }
}
