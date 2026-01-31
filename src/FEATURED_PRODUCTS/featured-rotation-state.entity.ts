import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
} from "sequelize-typescript";

@Table({
  tableName: "FEATURED_ROTATION_STATE",
  timestamps: true,
})
export class FeaturedRotationState extends Model<FeaturedRotationState> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
  })
  position: number;

  @Default(0)
  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
  })
  current_batch_index: number;

  @Default(0)
  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
  })
  total_products: number;

  // ✅ Use JSONB + defaultValue for Postgres safety
  @AllowNull(false)
  @Column({
    type: DataType.JSONB,
    defaultValue: [],
  })
  queue_product_ids: number[];

  @AllowNull(false)
  @Column({
    type: DataType.JSONB,
    defaultValue: [],
  })
  active_product_ids: number[];

  @AllowNull(false)
  @Column({
    type: DataType.JSONB,
    defaultValue: [],
  })
  fallback_product_ids: number[];

  @AllowNull(true)
  @Column({
    type: DataType.DATE,
  })
  next_rotation_at: Date | null;

  @AllowNull(true)
  @Column({
    type: DataType.DATE,
  })
  last_rotation_at: Date | null;

  @AllowNull(true)
  @Column({
    type: DataType.DATE,
  })
  queue_refreshed_at: Date | null;
}
