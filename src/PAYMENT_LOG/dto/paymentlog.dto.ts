import { ApiProperty } from "@nestjs/swagger";
import {PaymentLog } from "../paymentlog.entity";

export class PaymentLogDto {
  @ApiProperty()
  readonly userId: number;
  
  @ApiProperty()
  readonly addressId: number;
  
  @ApiProperty()
  readonly cart: JSON;
  
  @ApiProperty()
  readonly ref: string;
  
  @ApiProperty()
  readonly charges: JSON;
  
  
  constructor(paymentlog: PaymentLog) {
    this.userId = paymentlog.userId;
    this.addressId = paymentlog.addressId;
    this.cart = paymentlog.cart;
    this.ref = paymentlog.ref;
    this.charges = paymentlog.charges;
    
    }
}