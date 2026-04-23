import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

function toBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalizedValue)) {
    return false;
  }

  return undefined;
}

export class ResolveUnmatchedRemoteSubaccountsDto {
  @ApiPropertyOptional({
    description:
      "When true, previews the records that would be linked without writing to the database.",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description:
      "Optional list of local store IDs to consider while resolving unmatched remote subaccounts.",
    type: [Number],
    example: [4548, 4467],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.map((entry) => Number(entry));
    }

    return [Number(value)];
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  storeIds?: number[];

  @ApiPropertyOptional({
    description:
      "Optional list of specific remote Paystack subaccount codes to resolve.",
    type: [String],
    example: ["ACCT_abc123", "ACCT_xyz456"],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.map((entry) => String(entry).trim());
    }

    return [String(value).trim()];
  })
  @IsArray()
  @IsString({ each: true })
  subaccountCodes?: string[];

  @ApiPropertyOptional({
    description:
      "Optional classification list to resolve. Defaults to ['missing_local_link'] for safety.",
    type: [String],
    example: ["missing_local_link"],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.map((entry) => String(entry).trim());
    }

    return [String(value).trim()];
  })
  @IsArray()
  @IsString({ each: true })
  classifications?: string[];

  @ApiPropertyOptional({
    description: "Page number for previewing a subset of unmatched remote records.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: "Page size for previewing a subset of unmatched remote records.",
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
