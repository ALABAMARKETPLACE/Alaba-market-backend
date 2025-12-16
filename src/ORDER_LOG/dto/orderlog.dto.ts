import { ApiProperty } from "@nestjs/swagger";
import {OrderLog } from "../orderlog.entity";

export class OrderLogDto {
  @ApiProperty()
  readonly userId: number;
  
  @ApiProperty()
  readonly address: JSON;
  
  @ApiProperty()
  readonly cart: JSON;
  
  @ApiProperty()
  readonly payment: JSON;
  
  @ApiProperty()
  readonly charges: JSON;
  
  
  constructor(orderlog: OrderLog) {
    this.userId = orderlog.userId;
    this.address = orderlog.address;
    this.cart = orderlog.cart;
    this.payment = orderlog.payment;
    this.charges = orderlog.charges;
    
    }
}