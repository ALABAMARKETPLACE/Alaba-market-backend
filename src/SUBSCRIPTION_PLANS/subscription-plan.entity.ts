import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  DeletedAt,
} from "sequelize-typescript";

@Table({ tableName: "SUBSCRIPTION_PLANS", paranoid: true })
export class SubscriptionPlan extends Model<SubscriptionPlan> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.INTEGER)
  min_products: number;

  @Column(DataType.INTEGER)
  max_products: number;

  @Column(DataType.INTEGER)
  duration_days: number;

  @Column(DataType.DECIMAL(10, 2))
  price: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  is_active: boolean;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  featured_position: number;

  @DeletedAt
  @Column(DataType.DATE)
  deleted_at: Date;
}
