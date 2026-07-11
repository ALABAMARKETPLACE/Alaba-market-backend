import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { AuthGuard } from "../shared/guards/auth.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { BudPaySubaccountMigrationService } from "./budpay-subaccount-migration.service";
import {
  BudPayImportStatusQueryDto,
  BudPaySubaccountImportDto,
} from "./dto/budpay-subaccount-import.dto";

@Controller("budpay/admin/import-paystack-subaccounts")
@ApiTags("BudPay Admin")
@Roles(Role.Admin)
@UseGuards(AuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BudPayAdminController {
  constructor(
    private readonly migrationService: BudPaySubaccountMigrationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Import Paystack seller data into BudPay customer/virtual-account payout profiles",
  })
  @ApiOkResponse({ type: DataResponseDto })
  import(@Body() options: BudPaySubaccountImportDto) {
    return this.migrationService.import(options);
  }

  @Get("preview")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Preview BudPay seller payout profile imports without mutation",
  })
  @ApiOkResponse({ type: DataResponseDto })
  preview(@Query() options: BudPaySubaccountImportDto) {
    return this.migrationService.preview(options);
  }

  @Get("status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get BudPay seller payout profile import status" })
  @ApiOkResponse({ type: DataResponseDto })
  status(@Query() options: BudPayImportStatusQueryDto) {
    return this.migrationService.status(options);
  }
}
