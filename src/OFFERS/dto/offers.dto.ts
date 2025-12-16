import { ApiProperty } from "@nestjs/swagger";
import { Offers } from "../offers.entity";

export class OffersDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly start_date: Date;

  @ApiProperty()
  readonly end_date: Date;

  @ApiProperty()
  readonly title: string;

  @ApiProperty()
  readonly image: string;

  @ApiProperty()
  readonly tag: string;

  @ApiProperty()
  readonly slug: string;

  readonly products: any[];
  readonly createdAt: any;
  readonly status: boolean;

  constructor(offers: Offers) {
    this.id = offers.id;
    this.start_date = offers.start_date;
    this.end_date = offers.end_date;
    this.title = offers.title;
    this.image = offers.image;
    this.tag = offers.tag;
    this.products = offers.products;
    this.createdAt = offers.createdAt;
    this.status = offers.status;
    this.slug = offers.slug;
  }
}
