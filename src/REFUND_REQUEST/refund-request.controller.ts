import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../shared/decorator/roles.decorator";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { UserId } from "../shared/decorator/userId_decorator";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { RefundRequestSearchPaginationDto } from "./dto/refund-request-search.dto";
import { UpdateRefundRequestDto } from "./dto/update-refund-request.dto";
import { RefundRequestService } from "./refund-request.service";

@Controller("refund_request")
@ApiTags("refund_request")
export class RefundRequestController {
  constructor(private readonly refundRequestService: RefundRequestService) {}

  // For admin to get all refund requests with filtering
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("admin/all")
  @ApiBearerAuth()
  @ApiOkResponse()
  @HttpCode(200)
  findAllForAdmin(
    @Query() pageOpt: RefundRequestSearchPaginationDto
  ): Promise<DataResponseDto> {
    return this.refundRequestService.findAll(pageOpt);
  }

  // For store to view their refund requests
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Get("store/all")
  @ApiBearerAuth()
  @ApiOkResponse()
  @HttpCode(200)
  findAllForStore(
    @StoreId() storeId: number,
    @Query() pageOpt: RefundRequestSearchPaginationDto
  ): Promise<DataResponseDto> {
    return this.refundRequestService.findAll(pageOpt, storeId);
  }

  // For customer to view their refund requests
  @UseGuards(AuthGuard)
  @Get("user/all")
  @ApiBearerAuth()
  @ApiOkResponse()
  @HttpCode(200)
  findAllForUser(
    @UserId() userId: number,
    @Query() pageOpt: RefundRequestSearchPaginationDto
  ): Promise<DataResponseDto> {
    // Filter by customer_id in the service
    pageOpt["customer_id"] = userId;
    return this.refundRequestService.findAll(pageOpt);
  }

  // Get details of a specific refund request
  @UseGuards(AuthGuard)
  @Get(":id")
  @ApiBearerAuth()
  @ApiOkResponse()
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  getRefundRequestDetails(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.refundRequestService.findOne(id);
  }

  // // For admin to approve or reject a refund request
  @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Put("admin/approve/:id")
  @ApiBearerAuth()
  @ApiOkResponse()
  @ApiParam({ name: "id", required: true })
  @HttpCode(200)
  adminApprove(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateDto: UpdateRefundRequestDto
  ): Promise<DataResponseDto> {
    return this.refundRequestService.adminApprove(id, updateDto);
  }
}
