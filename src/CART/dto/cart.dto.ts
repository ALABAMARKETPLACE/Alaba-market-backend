import { ApiProperty } from "@nestjs/swagger";
import { CartTable } from "../cart.entity";

export class CartDto {
  @ApiProperty()
  readonly userId: number;

  @ApiProperty()
  readonly productId: number;

  @ApiProperty()
  readonly variantId: number;

  @ApiProperty()
  readonly quantity: number;

  @ApiProperty()
  readonly buyPrice: number;

  constructor(data: CartTable) {
    this.userId = data.userId;
    this.productId = data.productId;
    this.quantity = data.quantity;
    this.buyPrice = data.buyPrice;
    this.variantId = data.variantId;
  }
}

export class CartDataResponseDto {
  @ApiProperty()
  readonly data: any;

  @ApiProperty()
  readonly status: boolean;

  @ApiProperty()
  readonly statusCode: number;

  @ApiProperty()
  readonly message: string;

  readonly errorCode?: string;
  readonly isDifferentStore?: boolean;

  constructor(
    data: any,
    status: boolean = true,
    message: string = '',
    errorCode?: string,
    isDifferentStore?: boolean
  ) {
    this.status = status;
    this.statusCode = status ? 200 : 400;
    this.message = message || (status ? "Request Completed Successfully." : "No Data Found.");
    this.data = status ? data : null;
    this.errorCode = errorCode;
    this.isDifferentStore = isDifferentStore;
  }
}
