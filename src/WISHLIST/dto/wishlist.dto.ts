import { ApiProperty } from "@nestjs/swagger";
import { Wishlist } from "../wishlist.entity";

export class WishlistDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly userId: number;

  @ApiProperty()
  readonly productId: number;

  constructor(wishlist: Wishlist) {
    this.id = wishlist.id;
    this.userId = wishlist.userId;
    this.productId = wishlist.productId;
  }
}
