import { ProductReviews } from "./../prod_rev.entity";
import { ApiProperty } from "@nestjs/swagger";

export class ProductReviewsDto {
  @ApiProperty()
  readonly _id: number;

  @ApiProperty()
  readonly product_id: number;

  @ApiProperty()
  readonly user_id: number;

  @ApiProperty()
  readonly message: string;

  @ApiProperty()
  readonly rating: number;

  constructor(sub_cat: ProductReviews) {
    this._id = sub_cat._id
    this.product_id = sub_cat.product_id;
    this.user_id = sub_cat.user_id;
    this.message = sub_cat.message;
    this.rating = sub_cat.rating;
  }
}
