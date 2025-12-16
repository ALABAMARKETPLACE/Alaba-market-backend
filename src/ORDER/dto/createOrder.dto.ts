import { ApiProperty } from "@nestjs/swagger";
export class CreateOrderDto {
  @ApiProperty()
  readonly cart: CartItem[];

  @ApiProperty()
  readonly payment: paymentType;

  @ApiProperty()
  readonly address: AddressType;

  @ApiProperty()
  readonly charges: Charges;
}
export type CartItem = {
  readonly id?: number; //required.
  readonly productId: number;
  readonly variantId: number;
  readonly storeId: number;
  readonly quantity: number;
};

type paymentType = {
  ref: string;
  type: string;
};
export type AddressType = {
  readonly id: number;
};

export type gropedProducts = {
  storeId: number;
  products: CartItem[];
};
type Charges = {
  token: string;
};
