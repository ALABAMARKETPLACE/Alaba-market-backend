import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

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

  get offset() {
    return (Number(this.page) - 1) * Number(this.take);
  }

  get limit() {
    return Number(this.take);
  }
}
