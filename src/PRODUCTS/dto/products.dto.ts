import { ApiProperty } from "@nestjs/swagger";
import { Products } from "../products.entity";
import { IsArray, IsOptional, IsString } from "class-validator";

export class ProductsDto {
  @ApiProperty()
  readonly _id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly image: string;

  @ApiProperty()
  readonly bar_code: string;

  @ApiProperty()
  readonly sku: string;

  @ApiProperty()
  readonly brand: string;

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
  readonly store_id: number;

  @ApiProperty()
  readonly price: number;

  @ApiProperty()
  @IsOptional()
  readonly product_video: string;

  @ApiProperty()
  readonly product_weight: number;

  constructor(products: Products) {
    this._id = products._id;
    this.name = products.name;
    this.image = products.image;
    this.bar_code = products.bar_code;
    this.sku = products.sku;
    this.brand = products.brand;
    this.bulk_order = products.bulk_order;
    this.category = products.category;
    this.description = products.description;
    this.manufacture = products.manufacture;
    this.purchase_rate = products.purchase_rate;
    this.retail_rate = products.retail_rate;
    this.status = products.status;
    this.subCategory = products.subCategory;
    this.title = products.title;
    this.unit = products.unit;
    this.units = products.units;
    this.store_id = products.store_id;
    this.price = products.price;
    this.specifications = products.specifications;
    this.product_video = products.product_video;
    this.product_weight = products.product_weight;
  }
}

export class CheckSameStoreDto {
  @ApiProperty({
    description: "Array of product IDs",
    type: [String],
    example: ["prod1", "prod2", "prod3"],
  })
  @IsArray()
  @IsString({ each: true })
  pids: string[];
}
