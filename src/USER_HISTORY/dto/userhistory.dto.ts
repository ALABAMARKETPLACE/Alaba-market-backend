import { ApiProperty } from "@nestjs/swagger";
import { UserHistory } from "../userhistory.entity";

export class UserHistoryDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly userId: number;

  @ApiProperty()
  readonly productId: number;

  @ApiProperty()
  readonly variantId: number;

  constructor(userhistory: UserHistory) {
    this.id = userhistory.id;
    this.userId = userhistory.userId;
    this.productId = userhistory.productId;
    this.variantId = userhistory.variantId;
  }
}
