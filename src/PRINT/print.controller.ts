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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { OrderLoggingService } from "../ORDER_LOG/orderlog.service";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { RRole } from "../shared/decorator/role_decorator";
import { Roles } from "../shared/decorator/roles.decorator";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { UserId } from "../shared/decorator/userId_decorator";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { CancelPrintDto } from "./dto/cancel_print.dto";
import { CreatePrintDto } from "./dto/createPrint.dto";
import { PageOptionsGetPrintDto } from "./dto/getPrints.dto";
import { PrintDto } from "./dto/print.dto";
import { PrintSearchStoreDto } from "./dto/print_search_store.dto";
import { UpdatePrintStatus } from "./dto/update_print_status.dto";
import { PrintPlaceService } from "./print.place";
import { PrintService } from "./print.service";

@Controller("print")
@ApiTags("print")
export class PrintController {
  constructor(
    private readonly PrintService: PrintService,
    private readonly placePrint: PrintPlaceService,
    private readonly OrderLoggingService: OrderLoggingService
  ) {}

  //get all orders for a user
  @UseGuards(AuthGuard)
  @Get("all")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOkResponse({ type: [PrintDto] })
  findAll(
    @UserId() userId: number,
    @Query() pageOptions: PageOptionsGetPrintDto
  ): Promise<DataResponseDto> {
    return this.PrintService.findAll(userId, pageOptions);
  }

  //get all orders for a store.
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Get("store")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOkResponse({ type: [PrintDto] })
  findByStore(
    @StoreId() storeId: number,
    @Query() pageOptions: PrintSearchStoreDto
  ): Promise<DataResponseDto> {
    return this.PrintService.findOrderByStore(storeId, pageOptions);
  }

  //get all orders grouped by their statsu and count for seller
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Get("getall")
  @ApiDataObjectResponse(PrintDto)
  @HttpCode(200)
  getOrders(@StoreId() storeId: number): Promise<DataResponseDto> {
    return this.PrintService.getStoreOrders(storeId);
  }

  //get all orders grouped by their statsu and count for seller
  @UseGuards(AuthGuard)
  @Get("buy_again")
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiDataObjectResponse(PrintDto)
  @HttpCode(200)
  buyAgain(
    @UserId() userId: number,
    @Query() pageOptions: PageOptionsDto
  ): Promise<DataResponseDto> {
    return this.PrintService.buyAgain(userId, pageOptions);
  }

  //get all orders for a store. only for admin
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("store/:id")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOkResponse({ type: [PrintDto] })
  @ApiParam({ name: "id", required: true })
  findStoreOrders(
    @Param("id", new ParseIntPipe()) storeId: number,
    @Query() pageOptions: PrintSearchStoreDto
  ): Promise<DataResponseDto> {
    return this.PrintService.findOrderByStore(storeId, pageOptions);
  }

  //get all orders for admin(any users's)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("user/:id")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiParam({ name: "id", required: true })
  @ApiOkResponse({ type: [PrintDto] })
  findAllOrders(
    @Query() pageOptions: PageOptionsGetPrintDto,
    @Param("id") userId: number
  ): Promise<DataResponseDto> {
    return this.PrintService.findAll(userId, pageOptions);
  }

  //get deetails of an order for admin
  @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Get("details/:id")
  @ApiDataObjectResponse(PrintDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  findDetails(
    @StoreId() storeId: number,
    @RRole() role: string,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.PrintService.findOrder(id, role, storeId);
  }

  //get deetails of an order for admin
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("get_one/admin/:id")
  @ApiDataObjectResponse(PrintDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  findOrder(
    @StoreId() storeId: number,
    @RRole() role: string,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.PrintService.findOrder(id, role, storeId);
  }

  //get deetails of an  order for a  seller
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Get("get_one/seller/:id")
  @ApiBearerAuth()
  @ApiDataObjectResponse(PrintDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  findOneforUser(
    @StoreId() storeId: number,
    @Param("id", new ParseIntPipe())
    orderId: number
  ): Promise<DataResponseDto> {
    return this.PrintService.findOneForSeller(storeId, orderId);
  }

  //get deetails of an order for user
  @UseGuards(AuthGuard)
  @Get("get_one/user/:id")
  @ApiDataObjectResponse(PrintDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  findOne(
    @UserId() userId: number,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.PrintService.findOne(userId, id);
  }

  //create new Order
  @UseGuards(AuthGuard)
  @Post()
  @ApiDataObjectResponse(PrintDto)
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @UserId() userId: number,
    @Body() create: CreatePrintDto
  ): Promise<DataResponseDto> {
    // this.OrderLoggingService.create(userId, create);
    return this.placePrint.create(userId, create);
  }

  //to update order status only for sellers
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Put("update_status/:id")
  @ApiDataObjectResponse(PrintDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(201)
  @ApiBearerAuth()
  updateStatus(
    @Param("id", ParseIntPipe) orderId: number,
    @StoreId() storeId: number,
    @Body() create: UpdatePrintStatus
  ): Promise<DataResponseDto> {
    return this.PrintService.updateOrder(storeId, orderId, create);
  }

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Put("update_payment/:id")
  @ApiDataObjectResponse(PrintDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  @ApiBearerAuth()
  updatePayment(
    @Param("id", ParseIntPipe) orderId: number,
    @StoreId() storeId: number
  ): Promise<DataResponseDto> {
    return this.PrintService.completePayment(storeId, orderId);
  }

  //to cancel order for users.
  @UseGuards(AuthGuard)
  @Put("cancel_order/:id")
  @ApiDataObjectResponse(PrintDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(202)
  @ApiBearerAuth()
  cancelOrder(
    @UserId() userId: number,
    @Param("id", ParseIntPipe) id: number,
    @Body() create: CancelPrintDto
  ): Promise<DataResponseDto> {
    return this.PrintService.cancelOrder(userId, id, create);
  }
}
