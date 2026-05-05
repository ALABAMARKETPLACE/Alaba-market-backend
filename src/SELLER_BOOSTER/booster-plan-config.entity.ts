import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from "sequelize-typescript";
import { User } from "../USERS/user.entity";
import { SellerBoosterTier } from "./seller-booster.constants";

@Table({
  tableName: "BOOSTER_PLAN_CONFIGS",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
})
export class BoosterPlanConfig extends Model<BoosterPlanConfig> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Index
  @Unique
  @Column({
    type: DataType.ENUM("basic", "gold", "premium"),
    allowNull: false,
  })
  name: SellerBoosterTier;

  @Column({ type: DataType.STRING, allowNull: false })
  display_name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  product_limit: number | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  boost_score: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 30 })
  duration_days: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  price: number;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "NGN" })
  currency: string;

  @Index
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  is_active: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  is_unlimited: boolean;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  created_by: number | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  updated_by: number | null;

  @BelongsTo(() => User, { foreignKey: "created_by", constraints: false })
  creator: User;

  @BelongsTo(() => User, { foreignKey: "updated_by", constraints: false })
  updater: User;
}
