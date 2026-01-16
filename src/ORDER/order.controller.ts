import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
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
import { OrderService } from "./order.service";
import { OrderDto } from "./dto/order.dto";
import { CreateOrderDto } from "./dto/createOrder.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { UpdateOrderStatus } from "./dto/updateOrderStatus.dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { OrderSearchStoreDto } from "./dto/order_search_store.dto";
import { CancelOrderDto } from "./dto/cancelorder.dto";
import { UserId } from "../shared/decorator/userId_decorator";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { PageOptionsGetOrdersDto } from "./dto/getOrders.dto";
import { OrderPlaceService } from "./order.place";
import { OrderLoggingService } from "../ORDER_LOG/orderlog.service";
import { RRole } from "../shared/decorator/role_decorator";

@Controller("order")
@ApiTags("order")
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly placeOrder: OrderPlaceService,
    private readonly orderLogService: OrderLoggingService
  ) {}

  //get all orders for a user
  @UseGuards(AuthGuard)
  @Get("all")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOkResponse({ type: [OrderDto] })
  findAll(
    @UserId() userId: number,
    @Query() pageOptions: PageOptionsGetOrdersDto
  ): Promise<DataResponseDto> {
    return this.orderService.findAll(userId, pageOptions);
  }

  //DEBUG: Get ALL orders without any filtering (for testing)
  @Get("all-orders-debug")
  async getAllOrdersDebug(@Query() query: any) {
    console.log("[DEBUG] Getting ALL orders with query:", query);
    try {
      const orders = await this.orderService['OrderRepository'].findAll({
        attributes: ['id', 'order_id', 'status', 'storeId', 'userId', 'delivery_company_id', 'grandTotal', 'createdAt'],
        limit: query.limit ? parseInt(query.limit) : 100,
        offset: query.offset ? parseInt(query.offset) : 0,
        order: [['createdAt', 'DESC']],
      });
      const totalCount = await this.orderService['OrderRepository'].count();
      console.log(`Found ${totalCount} total orders, returning ${orders.length}`);
      return {
        status: true,
        data: orders,
        meta: {
          itemCount: totalCount,
          page: Math.floor((query.offset || 0) / (query.limit || 100)) + 1,
          take: query.limit || 100,
        }
      };
    } catch (err) {
      console.error("Error:", err);
      throw err;
    }
  }

  //get all orders for a store (or all orders for admin)
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Get("store")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOkResponse({ type: [OrderDto] })
  findByStore(
    @StoreId() storeId: number | undefined,
    @RRole() role: string,
    @Query() pageOptions: OrderSearchStoreDto
  ): Promise<DataResponseDto> {
    // For admin, storeId might be undefined - that's okay, it will return all orders
    // For seller, storeId is required
    if (role === Role.Seller && !storeId) {
      throw new HttpException("Store ID is required for sellers", HttpStatus.BAD_REQUEST);
    }
    return this.orderService.findOrderByStore(storeId, pageOptions);
  }

  //get all orders grouped by their statsu and count for seller
  // @Roles(Role.Seller, Role.Admin)
  // @UseGuards(AuthGuard)
  // @Get("getall")
  // @ApiBearerAuth()
  // @ApiDataObjectResponse([OrderDto])
  // @HttpCode(200)
  // getOrders(): Promise<DataResponseDto> {
  //   return this.orderService.getAllOrders();

  // Endpoint to fetch store order stats; if no storeId provided returns global stats (admin)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("store/stats")
  @ApiDataObjectResponse(OrderDto)
  @HttpCode(200)
  getStoreStats(@StoreId() storeId?: number): Promise<DataResponseDto> {
    return this.orderService.getStoreOrders(storeId);
  }
  // }

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Get("getall")
  @ApiBearerAuth()
  @ApiOkResponse({ type: OrderDto, isArray: true })
  @HttpCode(200)
  getOrders(): Promise<DataResponseDto> {
    return this.orderService.getAllOrders();
  }

  //get all orders grouped by their statsu and count for seller
  @UseGuards(AuthGuard)
  @Get("buy_again")
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiDataObjectResponse(OrderDto)
  @HttpCode(200)
  buyAgain(
    @UserId() userId: number,
    @Query() pageOptions: PageOptionsDto
  ): Promise<DataResponseDto> {
    return this.orderService.buyAgain(userId, pageOptions);
  }

  //get all orders for a store. only for admin
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("store/:id")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOkResponse({ type: [OrderDto] })
  @ApiParam({ name: "id", required: true })
  findStoreOrders(
    @Param("id", new ParseIntPipe()) storeId: number,
    @Query() pageOptions: OrderSearchStoreDto
  ): Promise<DataResponseDto> {
    return this.orderService.findOrderByStore(storeId, pageOptions);
  }

  //get all orders for admin(any users's)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("user/:id")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiParam({ name: "id", required: true })
  @ApiOkResponse({ type: [OrderDto] })
  findAllOrders(
    @Query() pageOptions: PageOptionsGetOrdersDto,
    @Param("id") userId: number
  ): Promise<DataResponseDto> {
    return this.orderService.findAll(userId, pageOptions);
  }

  //get deetails of an order for admin
  @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Get("details/:id")
  @ApiDataObjectResponse(OrderDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  findDetails(
    @StoreId() storeId: number,
    @RRole() role: string,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.orderService.findOrder(id, role, storeId);
  }

  //get deetails of an order for admin
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("get_one/admin/:id")
  @ApiDataObjectResponse(OrderDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  findOrder(
    @StoreId() storeId: number,
    @RRole() role: string,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.orderService.findOrder(id, role, storeId);
  }

  //get deetails of an  order for a  seller
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Get("get_one/seller/:id")
  @ApiBearerAuth()
  @ApiDataObjectResponse(OrderDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  findOneforUser(
    @StoreId() storeId: number,
    @Param("id", new ParseIntPipe())
    orderId: number
  ): Promise<DataResponseDto> {
    return this.orderService.findOneForSeller(storeId, orderId);
  }

  //get deetails of an order for user
  @UseGuards(AuthGuard)
  @Get("get_one/user/:id")
  @ApiDataObjectResponse(OrderDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  findOne(
    @UserId() userId: number,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.orderService.findOne(userId, id);
  }

  //create new Order
  @UseGuards(AuthGuard)
  @Post()
  @ApiDataObjectResponse(OrderDto)
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @UserId() userId: number,
    @Body() create: CreateOrderDto
  ): Promise<DataResponseDto> {
    this.orderLogService.create(userId, create);
    return this.placeOrder.create(userId, create);
  }

  //to update order status only for sellers
 @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Put("update_status/:id")
  @ApiDataObjectResponse(OrderDto)
  @ApiParam({
    name: "id",
    required: true,
    description: "Database primary key of the order",
  })
  @HttpCode(201)
  @ApiBearerAuth()
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() create: UpdateOrderStatus
  ): Promise<DataResponseDto> {
    return this.orderService.updateOrder(id, create);
  }

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Put("update_payment/:id")
  @ApiDataObjectResponse(OrderDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  @ApiBearerAuth()
  updatePayment(
    @Param("id", ParseIntPipe) orderId: number,
    @StoreId() storeId: number
  ): Promise<DataResponseDto> {
    return this.orderService.completePayment(storeId, orderId);
  }

  //to cancel order for users.
  @UseGuards(AuthGuard)
  @Put("cancel_order/:id")
  @ApiDataObjectResponse(OrderDto)
  @ApiParam({ name: "id", required: true })
  @HttpCode(202)
  @ApiBearerAuth()
  cancelOrder(
    @UserId() userId: number,
    @Param("id", ParseIntPipe) id: number,
    @Body() create: CancelOrderDto
  ): Promise<DataResponseDto> {
    return this.orderService.cancelOrder(userId, id, create);
  }
}
