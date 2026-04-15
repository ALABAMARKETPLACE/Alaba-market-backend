import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import {
  PaystackSubaccountMigrationQueryDto,
  PaystackSubaccountMigrationStatusQueryDto,
} from "./dto/paystack-subaccount-migration.dto";
import { PaystackSubaccountMigrationService } from "./paystack-subaccount-migration.service";

@Controller("admin/paystack/subaccounts")
@ApiTags("admin-paystack-subaccounts")
@Roles(Role.Admin)
@UseGuards(AuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PaystackSubaccountMigrationController {
  constructor(
    private readonly paystackSubaccountMigrationService: PaystackSubaccountMigrationService,
  ) {}

  @Post("migrate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Migrate all pending store subaccounts into the new Paystack account",
  })
  @ApiOkResponse({ type: DataResponseDto })
  migratePendingStores(
    @Query() query: PaystackSubaccountMigrationQueryDto,
  ): Promise<DataResponseDto> {
    return this.paystackSubaccountMigrationService.migratePendingStores(query);
  }

  @Post("migrate/retry-failed")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Retry failed Paystack subaccount migrations",
  })
  @ApiOkResponse({ type: DataResponseDto })
  retryFailedMigrations(
    @Query() query: PaystackSubaccountMigrationQueryDto,
  ): Promise<DataResponseDto> {
    return this.paystackSubaccountMigrationService.retryFailedMigrations(
      query,
    );
  }

  @Post("migrate/:storeId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Migrate a single store subaccount into the new Paystack account",
  })
  @ApiParam({ name: "storeId", required: true, type: Number })
  @ApiOkResponse({ type: DataResponseDto })
  migrateStoreById(
    @Param("storeId", ParseIntPipe) storeId: number,
    @Query() query: PaystackSubaccountMigrationQueryDto,
  ): Promise<DataResponseDto> {
    return this.paystackSubaccountMigrationService.migrateStoreById(
      storeId,
      query,
    );
  }

  @Get("migration-status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "List Paystack subaccount migration status for stores",
  })
  @ApiQuery({ name: "status", required: false, enum: ["pending", "success", "failed"] })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiOkResponse({ type: DataResponseDto })
  getMigrationStatus(
    @Query() query: PaystackSubaccountMigrationStatusQueryDto,
  ): Promise<DataResponseDto> {
    return this.paystackSubaccountMigrationService.getMigrationStatus(query);
  }

  @Get("migration-status/report.csv")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Export Paystack subaccount migration status as CSV",
  })
  async exportMigrationStatusCsv(
    @Query() query: PaystackSubaccountMigrationStatusQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="paystack-subaccount-migration-status.csv"',
    );

    return this.paystackSubaccountMigrationService.exportMigrationStatusCsv(
      query,
    );
  }
}
