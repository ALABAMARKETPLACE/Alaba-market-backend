import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Index,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Store } from "../STORE/store.entity";
import { User } from "../USERS/user.entity";
import { BoostedProduct } from "./boosted-product.entity";
import { BoosterPlanConfig } from "./booster-plan-config.entity";
import {
  SellerBoosterPlanStatus,
  SellerBoosterTier,
} from "./seller-booster.constants";

@Table({
  tableName: "SELLER_BOOSTER_PLANS",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
})
export class SellerBoosterPlan extends Model<SellerBoosterPlan> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Index
  @ForeignKey(() => Store)
  @Column({ type: DataType.BIGINT, allowNull: false })
  store_id: number;

  @Index
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  seller_id: number;

  @Index
  @Column({
    type: DataType.ENUM("basic", "gold", "premium"),
    allowNull: false,
  })
  tier: SellerBoosterTier;

  @Index
  @Column({
    type: DataType.ENUM("active", "expired", "cancelled", "pending"),
    allowNull: false,
    defaultValue: "pending",
  })
  status: SellerBoosterPlanStatus;

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

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  is_unlimited: boolean;

  @ForeignKey(() => BoosterPlanConfig)
  @Column({ type: DataType.BIGINT, allowNull: true })
  booster_plan_config_id: number | null;

  @Column({ type: DataType.DATE, allowNull: true })
  starts_at: Date | null;

  @Index
  @Column({ type: DataType.DATE, allowNull: true })
  expires_at: Date | null;

  @Index
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  paystack_reference: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  amount: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  selected_product_ids: number[] | null;

  @BelongsTo(() => Store, { foreignKey: "store_id", constraints: false })
  store: Store;

  @BelongsTo(() => User, { foreignKey: "seller_id", constraints: false })
  seller: User;

  @BelongsTo(() => BoosterPlanConfig, {
    foreignKey: "booster_plan_config_id",
    constraints: false,
  })
  booster_plan_config: BoosterPlanConfig;

  @HasMany(() => BoostedProduct, {
    foreignKey: "booster_plan_id",
    constraints: false,
  })
  boosted_products: BoostedProduct[];
}
