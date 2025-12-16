import { ApiProperty } from "@nestjs/swagger";
export class CreatePrintDto {
  @ApiProperty()
  readonly cart: PrintItem[];

  @ApiProperty()
  readonly payment: paymentType;

  @ApiProperty()
  readonly address: AddressType;

  @ApiProperty()
  readonly charges: Charges;

  @ApiProperty()
  readonly storeId: number;
}
export type PrintItem = {
  // readonly storeId: number;
  readonly quantity: number;
  readonly image : string,
  readonly orientation: string,
  readonly printType : string,
  readonly printColor : string,
  readonly price : number,
  readonly doublesided:boolean,
  readonly name : string,
  readonly number_of_pages?:number
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
  products: PrintItem[];
};
type Charges = {
  token: string;
};
