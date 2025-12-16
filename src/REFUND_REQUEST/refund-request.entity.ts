import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  IsIn,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Order } from "../ORDER/order.entity";
import { Store } from "../STORE/store.entity";
import { User } from "../USERS/user.entity";

@Table({
  tableName: "REFUND_REQUEST",
  timestamps: true,
})
export class RefundRequest extends Model<RefundRequest> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Order)
  @Column(DataType.BIGINT)
  order_id: number;

  @BelongsTo(() => Order)
  order: Order;

  @ForeignKey(() => Store)
  @Column(DataType.BIGINT)
  store_id: number;

  @BelongsTo(() => Store)
  store: Store;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  customer_id: number;

  @BelongsTo(() => User)
  customer: User;

  @Column(DataType.DECIMAL(10, 2))
  refund_amount: number;

  @Column(DataType.TEXT)
  reason: string;

  @IsIn({
    msg: "Invalid Status, Only waiting_refund, approved, rejected, or completed is Allowed",
    args: [["waiting_refund", "approved", "rejected", "completed"]],
  })
  @Column({
    type: DataType.STRING,
    defaultValue: "waiting_refund",
  })
  status: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_auto_approved: boolean;

  @Column(DataType.STRING)
  admin_note: string;

  @Column({ type: DataType.JSON, allowNull: true })
  stripe_refund_response: JSON;

  @Column(DataType.STRING)
  stripe_refund_id: string;

  @Column(DataType.DATE)
  refund_processed_date: Date;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  email_sent: boolean;

  @Column(DataType.DATE)
  email_sent_date: Date;
}
