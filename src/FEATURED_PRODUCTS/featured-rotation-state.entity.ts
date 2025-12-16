import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from "sequelize-typescript";

@Table({ tableName: "FEATURED_ROTATION_STATE", timestamps: true })
export class FeaturedRotationState extends Model<FeaturedRotationState> {
  @PrimaryKey
  @Column({ type: DataType.INTEGER })
  position: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  current_batch_index: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  total_products: number;

  @Default([])
  @Column({ type: DataType.JSON, allowNull: false })
  queue_product_ids: number[];

  @Default([])
  @Column({ type: DataType.JSON, allowNull: false })
  active_product_ids: number[];

  @Default([])
  @Column({ type: DataType.JSON, allowNull: false })
  fallback_product_ids: number[];

  @Column({ type: DataType.DATE, allowNull: true })
  next_rotation_at: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  last_rotation_at: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  queue_refreshed_at: Date | null;
}


