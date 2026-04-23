import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Order } from "../ORDER/order.entity";
import { Print } from "../PRINT/print.entity";

@Table({ tableName: "ORDER_PAYMENTS" })
export class OrderPayments extends Model<OrderPayments> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: true, unique: true })
  orderId: number;
  
  @ForeignKey(() => Print)
  @Column({ type: DataType.INTEGER, allowNull: true, unique: true })
  printId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  })
  paymentType: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  status: string;

  @Column({ type: DataType.STRING })
  currency: string;

  @Column({ type: DataType.STRING, allowNull: true })
  ref: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment:
      "True when the buyer paid into the company Paystack account and the seller must be settled manually",
  })
  requires_manual_settlement: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment:
      "How this payment was collected: store_subaccount or company_account_no_subaccount",
  })
  collection_mode: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Which Paystack account handled the charge: default, old, or new",
  })
  paystack_account_used: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Human-readable reason why manual settlement is required",
  })
  manual_settlement_reason: string;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
    set(value: number) {
      if (typeof value == "number") {
        this.setDataValue("amount", value / 100);
      } else {
        this.setDataValue("amount", 0);
      }
    },
  })
  amount: number;

  @Column({ type: DataType.STRING })
  cardHolder: string;

  @BelongsTo(() => Order)
  orderDetails: Order;
  @BelongsTo(() => Print)
  printDetails: Print;
}
