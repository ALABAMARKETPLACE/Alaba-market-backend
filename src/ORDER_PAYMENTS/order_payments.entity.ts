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
