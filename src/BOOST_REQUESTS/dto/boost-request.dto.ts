import { ApiProperty } from "@nestjs/swagger";
import { BoostRequest } from "../boost-request.entity";

export class BoostRequestDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly seller_id: number;

  @ApiProperty()
  readonly plan_id: number;

  @ApiProperty({ type: [Number] })
  readonly product_ids: number[];

  @ApiProperty()
  readonly days: number;

  @ApiProperty()
  readonly total_amount: number;

  @ApiProperty({ required: false, default: 100 })
  readonly boost_priority: number;

  @ApiProperty()
  readonly status: string;

  @ApiProperty()
  readonly requested_at: Date;

  @ApiProperty()
  readonly approved_at: Date;

  @ApiProperty()
  readonly remarks: string;

  @ApiProperty()
  readonly last_updated_by: number;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  // Include related data
  @ApiProperty({ required: false })
  readonly seller?: any;

  @ApiProperty({ required: false })
  readonly plan?: any;

  @ApiProperty({ required: false })
  products?: any[]; // Remove readonly - populated after construction

  constructor(boostRequest: BoostRequest) {
    this.id = boostRequest.id;
    this.seller_id = boostRequest.seller_id;
    this.plan_id = boostRequest.plan_id;
    this.product_ids = boostRequest.product_ids;
    this.days = boostRequest.days;
    this.total_amount = boostRequest.total_amount;
    this.boost_priority =
      typeof (boostRequest as any).boost_priority === "number"
        ? Number((boostRequest as any).boost_priority)
        : 100;
    this.status = boostRequest.status;
    this.requested_at = boostRequest.requested_at;
    this.approved_at = boostRequest.approved_at;
    this.remarks = boostRequest.remarks;
    this.last_updated_by = boostRequest.last_updated_by;
    this.createdAt = boostRequest.createdAt;
    this.updatedAt = boostRequest.updatedAt;

    // Include related entities if loaded
    if (boostRequest.seller) {
      this.seller = {
        id: boostRequest.seller.id,
        name: boostRequest.seller.name,
        email: boostRequest.seller.email,
        phone: boostRequest.seller.phone,
      };
    }

    if (boostRequest.plan) {
      this.plan = {
        id: boostRequest.plan.id,
        name: boostRequest.plan.name,
        min_products: boostRequest.plan.min_products,
        max_products: boostRequest.plan.max_products,
        duration_days: boostRequest.plan.duration_days,
        price: boostRequest.plan.price,
      };
    }
  }
}
