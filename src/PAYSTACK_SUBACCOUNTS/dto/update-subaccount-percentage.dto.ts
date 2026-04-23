import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
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

export class UpdateSubaccountPercentageDto {
  @ApiPropertyOptional({
    description:
      "Seller share to keep locally. The backend automatically sends the company share (100 - percentage_charge) to Paystack.",
    example: 93.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(99.99)
  percentage_charge?: number;

  @ApiPropertyOptional({
    description:
      "Optional list of store IDs to update. When omitted, all stores with paystack_subaccount_code_new are targeted.",
    example: [4548, 4467],
    type: [Number],
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
      "When true, returns the stores that would be updated without calling Paystack or writing to the database.",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  dryRun?: boolean;
}
