import { ApiProperty } from "@nestjs/swagger";

export class CalculateDeliveryChargeDto {
  @ApiProperty({
    description: "Cart items to price for delivery.",
  })
  readonly cart: CartItem[];

  @ApiProperty({
    description:
      "Selected saved address. Lat/long may still be sent, but the legacy distance fee is temporarily disabled.",
  })
  readonly address: AddressType;

  @ApiProperty({
    description: "Cart total before delivery charge is added.",
  })
  readonly total: number;
}
export type CartItem = {
  readonly id?: number;
  readonly userId: number;
  readonly productId: number;
  readonly variantId: number;
  readonly storeId: number;
  readonly quantity: number;
  readonly image: string;
  readonly totalPrice: number;
  readonly productDetails: ProductItemDto;
  readonly storeDetails: any;
  readonly buyPrice: number;
  readonly name: string;
};
type ProductItemDto = {
  readonly image: string;
  readonly name: string;
  readonly price: number;
};

export type AddressType = {
  readonly id: number;
  readonly userId: number;
  readonly flat: string;
  readonly fullAddress: string;
  readonly pin_code: string;
  readonly state: string;
  readonly city: string;
  readonly street: string;
  readonly alt_phone: string;
  readonly code: string;
  readonly geo_location: string;
  readonly type: string;
  readonly lat: number | null;
  readonly long: number | null;
};
export type gropedProducts = {
  storeId: number;
  totalPrice: number;
  totalCount: number;
  products: CartItem[];
};
