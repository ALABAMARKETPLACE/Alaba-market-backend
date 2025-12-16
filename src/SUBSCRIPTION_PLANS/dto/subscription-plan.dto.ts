import { ApiProperty } from "@nestjs/swagger";
import { SubscriptionPlan } from "../subscription-plan.entity";

export class SubscriptionPlanDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly min_products: number;

  @ApiProperty()
  readonly max_products: number;

  @ApiProperty()
  readonly duration_days: number;

  @ApiProperty()
  readonly price: number;

  @ApiProperty()
  readonly is_active: boolean;

  @ApiProperty()
  readonly featured_position: number;

  @ApiProperty()
  readonly created_at: Date;

  @ApiProperty()
  readonly updated_at: Date;

  constructor(subscriptionPlan: SubscriptionPlan) {
    this.id = subscriptionPlan.id;
    this.name = subscriptionPlan.name;
    this.min_products = subscriptionPlan.min_products;
    this.max_products = subscriptionPlan.max_products;
    this.duration_days = subscriptionPlan.duration_days;
    this.price = subscriptionPlan.price;
    this.is_active = subscriptionPlan.is_active;
    this.featured_position = subscriptionPlan.featured_position;
    this.created_at = subscriptionPlan.createdAt;
    this.updated_at = subscriptionPlan.updatedAt;
  }
}
