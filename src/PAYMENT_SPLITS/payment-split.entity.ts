import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Index,
} from "sequelize-typescript";
import { Store } from "../STORE/store.entity";
import { Order } from "../ORDER/order.entity";

@Table({ tableName: "PAYMENT_SPLITS" })
export class PaymentSplit extends Model<PaymentSplit> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Index
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  order_id: number;

  @Index
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  store_id: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  total_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  admin_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  seller_amount: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    defaultValue: 5.0,
  })
  admin_percentage: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    defaultValue: 95.0,
  })
  seller_percentage: number;

  @Column(DataType.STRING)
  paystack_transaction_id: string;

  @Column(DataType.JSON)
  paystack_split_response: JSON;

  @Index
  @Column({
    type: DataType.STRING(50),
    defaultValue: "pending",
  })
  split_status: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  admin_settled: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  seller_settled: boolean;

  @Column(DataType.DATE)
  admin_settled_at: Date;

  @Column(DataType.DATE)
  seller_settled_at: Date;

  @BelongsTo(() => Order, { foreignKey: 'order_id', constraints: false })
  order: Order;

  @BelongsTo(() => Store, { foreignKey: 'store_id', constraints: false })
  store: Store;
}