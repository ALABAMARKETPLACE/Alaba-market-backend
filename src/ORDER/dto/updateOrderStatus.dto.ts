import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional } from "class-validator";

const VALID_ORDER_STATUSES = [
  "pending",
  "processing",
  "packed",
  "dispatched",
  "shipped",
  "out_for_delivery",
  "picked_up",
  "delivered",
  "cancelled",
  "rejected",
  "failed",
  "substitution",
  "waiting_refund",
] as const;

export class UpdateOrderStatus {
  @ApiProperty({ enum: VALID_ORDER_STATUSES })
  @IsNotEmpty()
  @IsIn(VALID_ORDER_STATUSES, {
    message: `status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
  })
  readonly status: string;

  @ApiProperty()
  @IsOptional()
  readonly remark: string;

  @ApiProperty()
  @IsOptional()
  readonly delivery_date: string;
}
