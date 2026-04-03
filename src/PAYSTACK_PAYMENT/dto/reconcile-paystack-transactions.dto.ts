import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ReconcilePaystackTransactionsDto {
  @ApiPropertyOptional({
    description: "Starting Paystack page to inspect",
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of Paystack transactions to fetch per page",
    example: 50,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number = 50;

  @ApiPropertyOptional({
    description: "Maximum number of Paystack pages to scan in this run",
    example: 5,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxPages?: number = 1;

  @ApiPropertyOptional({
    description: "Limit reconciliation to a single Paystack reference",
    example: "guest_171234567890_abcd",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  reference?: string;

  @ApiPropertyOptional({
    description:
      "Filter Paystack transactions by status before reconciling. Defaults to success.",
    example: "success",
    default: "success",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  status?: string = "success";

  @ApiPropertyOptional({
    description: "Optional inclusive start date filter passed to Paystack",
    example: "2026-04-01",
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: "Optional inclusive end date filter passed to Paystack",
    example: "2026-04-30",
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description:
      "When true, only reports what is missing/already linked without writing to the DB.",
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      return value.toLowerCase() !== "false";
    }

    return true;
  })
  @IsBoolean()
  dryRun?: boolean = true;
}
