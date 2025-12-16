import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";

@Table({ tableName: "ORDER_LOG" })
export class OrderLog extends Model<OrderLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT })
  id: number;

  @Column({ type: DataType.INTEGER })
  userId: number;

  @Column({ type: DataType.JSON })
  address: JSON | any;

  @Column({ type: DataType.JSON })
  cart: JSON | any;

  @Column({ type: DataType.JSON })
  payment: JSON | any;

  @Column({ type: DataType.JSON })
  charges: JSON | any;
}
