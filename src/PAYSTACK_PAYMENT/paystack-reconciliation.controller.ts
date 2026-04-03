import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { PaystackReconciliationService } from "./paystack-reconciliation.service";
import { DataResponseDto } from "../shared/dto/data-response-dto";

@Controller("paystack/reconciliation")
@ApiTags("paystack-reconciliation")
export class PaystackReconciliationController {
  constructor(
    private readonly reconciliationService: PaystackReconciliationService,
  ) {}

  @Get("orphaned-payments")
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: "Find orphaned Paystack payments (not linked to orders)",
    description:
      "Identifies successful Paystack payments that were not registered as orders in the database.",
  })
  async getOrphanedPayments(): Promise<DataResponseDto> {
    const result =
      await this.reconciliationService.findOrphanedPaystackPayments();
    return new DataResponseDto(
      result,
      true,
      "Orphaned payments reconciliation complete",
    );
  }

  @Get("orphaned-guest-checkout")
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: "Find unprocessed guest checkouts",
    description:
      "Identifies guest checkouts that have successful payment but orders were not finalized.",
  })
  async getOrphanedGuestCheckout(): Promise<DataResponseDto> {
    const result = await this.reconciliationService.findOrphanedGuestCheckout();
    return new DataResponseDto(
      result,
      true,
      "Guest checkout reconciliation complete",
    );
  }

  @Get("full-report")
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: "Generate full reconciliation report",
    description:
      "Comprehensive report of all payment/order reconciliation issues.",
  })
  async getFullReport(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("take", new DefaultValuePipe(50), ParseIntPipe) take: number,
  ): Promise<DataResponseDto> {
    const result =
      await this.reconciliationService.generateReconciliationReport(page, take);
    return new DataResponseDto(
      result,
      true,
      "Full reconciliation report generated",
    );
  }

  @Get("audit-mismatches")
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: "Audit ORDER ↔ ORDER_PAYMENTS mismatches",
    description:
      "Identify orders without payment records or payment references that don't match.",
  })
  async auditMismatches(): Promise<DataResponseDto> {
    const result =
      await this.reconciliationService.auditOrderPaymentMismatches();
    return new DataResponseDto(
      result,
      true,
      "ORDER ↔ ORDER_PAYMENTS audit complete",
    );
  }
}
