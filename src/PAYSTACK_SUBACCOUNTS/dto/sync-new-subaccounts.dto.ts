import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
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

export class SyncNewSubaccountsDto {
  @ApiPropertyOptional({
    description:
      "When true, previews matches without updating local store records.",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description:
      "When true, overwrites existing paystack_subaccount_code_new values on matched stores.",
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({
    description:
      "Optional list of store IDs to limit local matching to specific stores.",
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
    description: "Paystack pagination page size.",
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;

  @ApiPropertyOptional({
    description:
      "Maximum number of Paystack pages to scan. Omit to scan until Paystack's reported pageCount.",
    example: 40,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxPages?: number;
}
