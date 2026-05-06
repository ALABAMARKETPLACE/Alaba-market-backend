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
} from "sequelize-typescript";
import { Products } from "../PRODUCTS/products.entity";
import { Store } from "../STORE/store.entity";
import { User } from "../USERS/user.entity";
import {
  BoostedProductStatus,
  SellerBoosterTier,
} from "./seller-booster.constants";
import { SellerBoosterPlan } from "./seller-booster-plan.entity";

@Table({
  tableName: "BOOSTED_PRODUCTS",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
})
export class BoostedProduct extends Model<BoostedProduct> {
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
  @ForeignKey(() => Products)
  @Column({ type: DataType.BIGINT, allowNull: false })
  product_id: number;

  @Index
  @ForeignKey(() => SellerBoosterPlan)
  @Column({ type: DataType.BIGINT, allowNull: false })
  booster_plan_id: number;

  @Column({
    type: DataType.ENUM("basic", "gold", "premium"),
    allowNull: false,
  })
  tier: SellerBoosterTier;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  boost_score: number;

  @Column({ type: DataType.DATE, allowNull: false })
  starts_at: Date;

  @Index
  @Column({ type: DataType.DATE, allowNull: false })
  expires_at: Date;

  @Index
  @Column({
    type: DataType.ENUM("active", "expired", "cancelled"),
    allowNull: false,
    defaultValue: "active",
  })
  status: BoostedProductStatus;

  @BelongsTo(() => Products, { foreignKey: "product_id", constraints: false })
  product: Products;

  @BelongsTo(() => SellerBoosterPlan, {
    foreignKey: "booster_plan_id",
    constraints: false,
  })
  booster_plan: SellerBoosterPlan;

  @BelongsTo(() => Store, { foreignKey: "store_id", constraints: false })
  store: Store;

  @BelongsTo(() => User, { foreignKey: "seller_id", constraints: false })
  seller: User;
}
