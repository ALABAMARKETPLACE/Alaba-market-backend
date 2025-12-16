import { ApiProperty } from "@nestjs/swagger";
import { Settlements } from "../settlements.entity";

export class SettlementsDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly storeId: number;

  @ApiProperty()
  readonly total: number;

  @ApiProperty()
  readonly balance: number;

  @ApiProperty()
  readonly paid: number;
  @ApiProperty()
  readonly user_bank_id: number;

  @ApiProperty()
  readonly payment_type: string;

  @ApiProperty()
  readonly remark: string;

  @ApiProperty()
  readonly status: string;

  constructor(settlements: Settlements) {
    this.id = settlements.id;
    this.storeId = settlements.storeId;
    this.total = settlements.total;
    this.balance = settlements.balance;
    this.paid = settlements.paid;
    this.user_bank_id = settlements.user_bank_id;
    this.payment_type=settlements.payment_type;
    this.status=settlements.status;
    this.remark=settlements.remark;
  }
}
