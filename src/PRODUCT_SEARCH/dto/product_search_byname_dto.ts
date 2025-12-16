import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Order } from "../../shared/constants/constants";
type SearchType = "single" | "multi";
export class ProductSearchByNameDto {
  @ApiProperty({ default: "single" })
  @IsString()
  @Type(() => String)
  readonly type: SearchType;

  @ApiProperty()
  @IsString()
  @Type(() => String)
  readonly name: string;

  @ApiPropertyOptional({ enum: Order, default: Order.ASC })
  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order = Order.ASC;

  @ApiPropertyOptional({ enum: Order, default: Order.ASC })
  @IsOptional()
  readonly price?: string;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  readonly take?: number = 10;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 20,
    default: 11,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  readonly take2?: number = 11;

  get skip(): number {
    return (this.page - 1) * this.take;
  }

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsLatitude()
  readonly lattitude?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsLongitude()
  readonly longitude?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100000, default: 4 })
  @Type(() => Number)
  @IsOptional()
  readonly radius?: number;
}
