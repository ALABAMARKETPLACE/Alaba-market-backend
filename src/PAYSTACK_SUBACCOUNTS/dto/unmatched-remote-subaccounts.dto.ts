import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";

export class UnmatchedRemoteSubaccountsQueryDto {
  @ApiPropertyOptional({
    description:
      "Optional list of local store IDs to use when computing matched vs unmatched remote subaccounts.",
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
    description: "Page number for the unmatched remote subaccount list.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: "Page size for the unmatched remote subaccount list.",
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
