import { ApiProperty } from "@nestjs/swagger";
import { StoreReview } from "../storereview.entity";

export class StoreReviewDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly storeId: number;

  @ApiProperty()
  readonly orderId: number;

  @ApiProperty()
  readonly userId: number;

  @ApiProperty()
  readonly rating: number;

  @ApiProperty()
  readonly remark: string;

  constructor(storereview: StoreReview) {
    this.id = storereview.id;
    this.storeId = storereview.storeId;
    this.rating = storereview.rating;
    this.remark = storereview.remark;
    this.userId = storereview.userId;
  }
}
