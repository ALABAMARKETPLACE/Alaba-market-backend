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
import { PaystackSubaccountService } from "./paystack-subaccount.service";
import { CreateSubaccountDto, ApproveSubaccountDto, RejectSubaccountDto } from "./dto/create-subaccount.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { UserId } from "../shared/decorator/userId_decorator";

@Controller("paystack-subaccounts")
@ApiTags("paystack-subaccounts")
export class PaystackSubaccountController {
  constructor(private readonly paystackSubaccountService: PaystackSubaccountService) {}

  // Create subaccount request (Seller only)
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Post("request")
  @ApiCreatedResponse({ type: DataResponseDto })
  @HttpCode(201)
  @ApiBearerAuth()
  createSubaccountRequest(
    @StoreId() storeId: number,
    @Body() createSubaccountDto: CreateSubaccountDto
  ): Promise<DataResponseDto> {
    return this.paystackSubaccountService.createSubaccountRequest(storeId, createSubaccountDto);
  }

  // Get subaccount by store (Seller only)
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Get("my-subaccount")
  @ApiOkResponse({ type: DataResponseDto })
  @HttpCode(200)
  @ApiBearerAuth()
  getMySubaccount(@StoreId() storeId: number): Promise<DataResponseDto> {
    return this.paystackSubaccountService.getSubaccountByStore(storeId);
  }

  // Get all pending subaccount requests (Admin only)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("pending")
  @ApiOkResponse({ type: DataResponseDto })
  @HttpCode(200)
  @ApiBearerAuth()
  getPendingSubaccounts(): Promise<DataResponseDto> {
    return this.paystackSubaccountService.getPendingSubaccounts();
  }

  // Approve subaccount (Admin only)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put(":id/approve")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  approveSubaccount(
    @Param("id", ParseIntPipe) subaccountId: number,
    @UserId() adminUserId: number,
    @Body() approveDto: ApproveSubaccountDto
  ): Promise<DataResponseDto> {
    return this.paystackSubaccountService.approveSubaccount(subaccountId, adminUserId);
  }

  // Reject subaccount (Admin only)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put(":id/reject")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  rejectSubaccount(
    @Param("id", ParseIntPipe) subaccountId: number,
    @UserId() adminUserId: number,
    @Body() rejectDto: RejectSubaccountDto
  ): Promise<DataResponseDto> {
    return this.paystackSubaccountService.rejectSubaccount(
      subaccountId, 
      adminUserId, 
      rejectDto.rejection_reason
    );
  }

  // Get Paystack supported banks (Public endpoint for frontend validation)
  @Get("banks/supported")
  @ApiOkResponse({ type: DataResponseDto })
  @HttpCode(200)
  getSupportedBanks(): Promise<DataResponseDto> {
    return this.paystackSubaccountService.getSupportedBanks();
  }

  // Validate bank account details (Public endpoint for frontend validation)
  @Get("banks/validate")
  @ApiOkResponse({ type: DataResponseDto })
  @HttpCode(200)
  validateBankAccount(
    @Query('account_number') accountNumber: string,
    @Query('bank_code') bankCode: string
  ): Promise<DataResponseDto> {
    if (!accountNumber || !bankCode) {
      throw new BadRequestException('account_number and bank_code are required');
    }
    return this.paystackSubaccountService.validateBankAccount(accountNumber, bankCode);
  }

  // Check if bank is supported (Public endpoint for frontend validation)
  @Get("banks/:bankCode/supported")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "bankCode", required: true })
  @HttpCode(200)
  isBankSupported(@Param("bankCode") bankCode: string): Promise<DataResponseDto> {
    return this.paystackSubaccountService.isBankSupported(bankCode);
  }

  // Get subaccount by ID (Admin only)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get(":id")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  getSubaccountById(@Param("id", ParseIntPipe) id: number): Promise<DataResponseDto> {
    return this.paystackSubaccountService.getSubaccountByStore(id);
  }
}