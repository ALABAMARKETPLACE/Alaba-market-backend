import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateProductsDto {
  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly image: image;

  @ApiProperty()
  readonly bar_code: string;

  @ApiProperty()
  readonly sku: string;

  @ApiProperty()
  readonly brand: string;

  @ApiProperty()
  readonly slug: string;

  @ApiProperty()
  readonly bulk_order: boolean;

  @ApiProperty()
  readonly category: number;

  @ApiProperty()
  readonly description: string;

  @ApiProperty()
  readonly specifications: string;

  @ApiProperty()
  readonly manufacture: string;

  @ApiProperty()
  @IsOptional()
  readonly purchase_rate: number;

  @ApiProperty()
  readonly retail_rate: number;

  @ApiProperty()
  readonly status: boolean;

  @ApiProperty()
  readonly subCategory: number;

  @ApiProperty()
  readonly title: string;

  @ApiProperty()
  readonly unit: number;

  @ApiProperty()
  readonly units: number;

  @ApiProperty()
  readonly price: number;

  @ApiProperty()
  @IsOptional()
  readonly product_video?: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  readonly product_weight: number;
}
type image = {
  url: string;
  status: boolean;
};
