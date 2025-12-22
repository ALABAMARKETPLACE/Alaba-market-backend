import { UUID } from "crypto";
import { DataTypes } from "sequelize";
import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import { Driver } from "./driver.entity";
import { Order } from "../ORDER/order.entity";

@Table({ tableName: "DRIVER_ORDER" })
export class DriverOrder extends Model<DriverOrder> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Driver)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    comment: "Reference to DRIVER table"
  })
  driver_id: number;

  @BelongsTo(() => Driver, { foreignKey: 'driver_id' })
  driver: Driver;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    comment: "Reference to ORDER table"
  })
  order_id: number;

  @BelongsTo(() => Order, { foreignKey: 'order_id' })
  order: Order;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Assignment status: assigned, in_transit, delivered, unassigned"
  })
  assignment_status: string;

  @Column({
    type: DataType.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  })
  driver_order_id: UUID;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: "Unique constraint on driver_id + order_id"
  })
  unique_assignment: string;
}

