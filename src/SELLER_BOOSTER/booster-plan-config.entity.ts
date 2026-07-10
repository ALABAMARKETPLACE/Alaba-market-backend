import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "BOOSTER_PLAN_CONFIGS" })
export class BoosterPlanConfig extends Model<BoosterPlanConfig> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  display_name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  product_limit: number | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  boost_score: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  duration_days: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  price: number;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "NGN" })
  currency: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  is_active: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  is_unlimited: boolean;

  @Column({ type: DataType.BIGINT, allowNull: true })
  created_by: number | null;

  @Column({ type: DataType.BIGINT, allowNull: true })
  updated_by: number | null;
}
