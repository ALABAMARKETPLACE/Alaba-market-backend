import { ApiProperty } from "@nestjs/swagger";
export class CreatePrintItemsDto {
  @ApiProperty()
  readonly orderId: number;

  @ApiProperty()
  readonly cart: CartItemDto[];
}
export class CartItemDto {
  @ApiProperty()
  readonly productId: number;

  @ApiProperty()
  readonly userId: number;

  @ApiProperty()
  readonly variantId: number;

  @ApiProperty()
  readonly quantity: number;

  @ApiProperty()
  readonly totalPrice: number;

  @ApiProperty()
  readonly productDetails: ProductItemDto;
}

type ProductItemDto = {
  readonly image: string;
  readonly price: number;
  readonly name: string;
};
