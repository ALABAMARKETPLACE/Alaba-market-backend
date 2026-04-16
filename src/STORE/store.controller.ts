import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { StoreService } from "./store.service";
import { StoreDto } from "./dto/store.dto";
import { UpdateStoreDto } from "./dto/updateStore.dto";
import { UpdateStoreStatusDto } from "./dto/updateStatus.dto";
import { RequestDocumentMailDto } from "./dto/requestDocumentMail.dto";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { StoreSearchPaginationDto } from "./dto/store_search_dto";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { CreateNewStoreDto } from "./dto/createNewStore.dto";
import { UserId } from "../shared/decorator/userId_decorator";
import { UpgradeToSellerDto } from "./dto/upgradeToSeller.dto";
import { StoreAccountDetailsDto } from "./dto/storeAccountDetails.dto";
import { UpdateAccountDetailsDto } from "./dto/updateAccountDetails.dto";
import { Public } from "../shared/decorator/optional.decorator";

@Controller("coorporate_store")
@ApiTags("coorporate_store")
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  private resolveStoreId(
    storeIdFromDecorator?: number,
    storeIdQuery?: string
  ): number {
    if (storeIdQuery) {
      const parsed = parseInt(storeIdQuery, 10);
      if (Number.isNaN(parsed)) {
        throw new BadRequestException("storeId query must be a number");
      }
      return parsed;
    }
    if (!storeIdFromDecorator) {
      throw new BadRequestException("Store id is required");
    }
    return storeIdFromDecorator;
  }

  //this api check if the store status is approved or not
  @UseGuards(AuthGuard)
  @Get("store_check")
  @ApiOkResponse({ type: [StoreDto] })
  @HttpCode(200)
  checkStore(@UserId() UserId: number): Promise<DataResponseDto> {
    return this.storeService.findOne(UserId);
  }

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Get("account/details")
  @ApiOkResponse({ type: StoreAccountDetailsDto })
  @ApiBearerAuth()
  getAccountDetails(
    @StoreId() storeId: number,
    @Query("storeId") storeIdQuery?: string
  ): Promise<DataResponseDto> {
    const resolvedId = this.resolveStoreId(storeId, storeIdQuery);
    return this.storeService.getAccountDetails(resolvedId);
  }

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Put("account/details")
  @ApiOkResponse({ type: StoreAccountDetailsDto })
  @ApiBearerAuth()
  updateAccountDetails(
    @StoreId() storeId: number,
    @Body() payload: UpdateAccountDetailsDto,
    @Query("storeId") storeIdQuery?: string
  ): Promise<DataResponseDto> {
    const resolvedId = this.resolveStoreId(storeId, storeIdQuery);
    return this.storeService.updateAccountDetails(resolvedId, payload);
  }

  //to get all details of a seller only after login
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Get("details")
  @ApiOkResponse({ type: [StoreDto] })
  @HttpCode(200)
  findSeller(@StoreId() storeId: number): Promise<DataResponseDto> {
    return this.storeService.findStore(storeId);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("dashboard/admin")
  @ApiOkResponse({ type: [StoreDto] })
  @HttpCode(200)
  getAdminDashboard(): Promise<DataResponseDto> {
    return this.storeService.getAdminDashboardInfo();
  }

  //to get all details of a seller only after login
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("sellerdetails/:id")
  @ApiOkResponse({ type: [StoreDto] })
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  getSellerDetails(@Param("id") storeId: number): Promise<DataResponseDto> {
    return this.storeService.findStore(storeId);
  }

  //to get list of all approved sellers
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("pgn/:type")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [StoreDto] })
  @ApiParam({ name: "type", required: true })
  findAll(
    @Param("type") type: string,
    @Query() pageOpt: StoreSearchPaginationDto
  ): Promise<DataResponseDto> {
    return this.storeService.findAll(pageOpt, type);
  }

  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Get("dashboard/:id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [StoreDto] })
  @HttpCode(200)
  getDashboardInfo(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.storeService.getSellerDashboardInfo(id);
  }

  @Get("print/time/:id")
  @ApiOkResponse({ type: Number })
  @HttpCode(200)
  getPrintTime(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.storeService.getPrintTime(id);
  }

  @Post("create")
  @ApiCreatedResponse({ type: [StoreDto] })
  @HttpCode(201)
  @ApiBearerAuth()
  create(@Body() create: CreateNewStoreDto): Promise<DataResponseDto> {
    return this.storeService.create(create);
  }

  //for already existing user to become a seller======================================new service
  @UseGuards(AuthGuard)
  @Post("createexist")
  @ApiCreatedResponse({ type: [StoreDto] })
  @HttpCode(201)
  @ApiBearerAuth()
  becomeSeller(
    @UserId() userId: number,
    @Body() create: UpgradeToSellerDto
  ): Promise<DataResponseDto> {
    return this.storeService.becomeSeller(userId, create);
  }

  //to request more documents from the store owner ...admin only=============update template
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post("send_mail")
  @ApiCreatedResponse({ type: [StoreDto] })
  @HttpCode(200)
  @ApiBearerAuth()
  requestDocumentMail(
    @Body() mail: RequestDocumentMailDto
  ): Promise<DataResponseDto> {
    return this.storeService.reqestDocumentMail(mail);
  }

  //to update the details of store only for seller (only certain fields are editable)
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Put("update")
  @ApiOkResponse({ type: StoreDto })
  @ApiBearerAuth()
  update(
    @StoreId() storeId: number,
    @Body() update: UpdateStoreDto
  ): Promise<DataResponseDto> {
    return this.storeService.update(update, storeId);
  }

  //to approve or reject a seller request for admin.
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put("status/:id")
  @ApiOkResponse({ type: StoreDto })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  updateStatus(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() update: UpdateStoreStatusDto
  ): Promise<DataResponseDto> {
    return this.storeService.updateStatus(id, update);
  }

  //to deactivate a seller who is alredy approved
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put("deactivate/:id")
  @ApiOkResponse({ type: StoreDto })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  deactivateSeller(
    @Param("id", ParseIntPipe) storeId: number
  ): Promise<DataResponseDto> {
    return this.storeService.deactivateSeller(storeId);
  }

  // public route — no auth required
  @Public()
  @UseGuards(AuthGuard)
  @Get("slug/:slug")
  @ApiOkResponse({ type: StoreDto })
  @ApiParam({ name: "slug", required: true })
  @HttpCode(200)
  findStoreBySlug(
    @Param("slug") slug: string,
  ): Promise<DataResponseDto> {
    return this.storeService.findStoreBySlug(slug);
  }
}
