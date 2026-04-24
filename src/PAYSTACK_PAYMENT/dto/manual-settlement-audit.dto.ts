import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class ManualSettlementAuditDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly take?: number = 10;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly storeId?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly reference?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly buyerEmail?: string;

  @ApiPropertyOptional({
    description: "Filter orders by order status",
  })
  @IsString()
  @IsOptional()
  readonly status?: string;

  @ApiPropertyOptional({
    description:
      "Filter by collection mode: store_subaccount, company_account_no_subaccount, or legacy",
    enum: ["store_subaccount", "company_account_no_subaccount", "legacy"],
  })
  @IsIn(["store_subaccount", "company_account_no_subaccount", "legacy"])
  @IsOptional()
  readonly collectionMode?:
    | "store_subaccount"
    | "company_account_no_subaccount"
    | "legacy";

  @ApiPropertyOptional({
    description: "Filter by Paystack account used: default, old, or new",
    enum: ["default", "old", "new"],
  })
  @IsIn(["default", "old", "new"])
  @IsOptional()
  readonly paystackAccountUsed?: "default" | "old" | "new";

  @ApiPropertyOptional({
    description: "Inclusive start date filter in ISO format",
  })
  @IsDateString()
  @IsOptional()
  readonly from?: string;

  @ApiPropertyOptional({
    description: "Inclusive end date filter in ISO format",
  })
  @IsDateString()
  @IsOptional()
  readonly to?: string;

  get offset() {
    return (Number(this.page) - 1) * Number(this.take);
  }

  get limit() {
    return Number(this.take);
  }
}
