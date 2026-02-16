// orderlog.entity.ts
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";

@Table({
  tableName: "ORDER_LOG",
  timestamps: true, // ✅ Auto-manage createdAt/updatedAt
})
export class OrderLog extends Model<OrderLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT })
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number;

  // ✅ NEW: Track order status
  @Column({
    type: DataType.STRING,
    defaultValue: "pending",
    comment: "Order attempt status: pending, success, failed",
  })
  status: string;

  // ✅ NEW: Store error message if failed
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "Error message if order creation failed",
  })
  error: string;

  // ✅ NEW: Reference to created order (if successful)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    comment: "ORDER.id if order was successfully created",
  })
  orderId: number;

  // ✅ NEW: Business order ID (if successful)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    comment: "ORDER.order_id (business ID) if created",
  })
  businessOrderId: number;

  // Original fields (keep as-is)
  @Column({
    type: DataType.JSONB, // ✅ Use JSONB for better performance
    allowNull: true,
  })
  address: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  cart: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  payment: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  charges: any;

  // ✅ Auto-managed timestamps
  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt: Date;
}
