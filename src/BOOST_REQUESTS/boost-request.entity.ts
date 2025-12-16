import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DeletedAt,
} from "sequelize-typescript";
import { Store } from "../STORE/store.entity";
import { SubscriptionPlan } from "../SUBSCRIPTION_PLANS/subscription-plan.entity";

@Table({ tableName: "BOOST_REQUESTS", paranoid: true })
export class BoostRequest extends Model<BoostRequest> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Store)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    references: {
      model: "STORE",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  seller_id: number;

  @ForeignKey(() => SubscriptionPlan)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    references: {
      model: "SUBSCRIPTION_PLANS",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  plan_id: number;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    comment: "Array of product IDs",
  })
  product_ids: number[];

  @Column({ type: DataType.INTEGER, allowNull: false })
  days: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  total_amount: number;

  @Column({
    type: DataType.ENUM("pending", "approved", "rejected", "expired"),
    defaultValue: "pending",
    allowNull: false,
  })
  status: string;

  @Column({ type: DataType.DATE, allowNull: true })
  requested_at: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  approved_at: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  remarks: string;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 100 })
  boost_priority: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  last_updated_by: number;

  @DeletedAt
  @Column(DataType.DATE)
  deleted_at: Date;

  // Relationships
  @BelongsTo(() => Store)
  seller: Store;

  @BelongsTo(() => SubscriptionPlan)
  plan: SubscriptionPlan;
}
