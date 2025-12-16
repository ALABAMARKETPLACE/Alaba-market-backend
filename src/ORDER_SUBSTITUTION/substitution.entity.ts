import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Min,
  ForeignKey,
  BelongsTo,
  HasMany,
  IsIn,
} from "sequelize-typescript";
import { Order } from "../ORDER/order.entity";
import { OrderItems } from "../ORDER_ITEMS/order_items.entity";
import { SubstituteProducts } from "./substitute.products.entity";

@Table({ tableName: "ORDER_SUBSTITUTION" })
export class OrderSubstitution extends Model<OrderSubstitution> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  orderId: number | any;

  @ForeignKey(() => OrderItems)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  orderItemId: number;

  @Min(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  availableQuantity: number;

  @Min(1)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  substitueQuantity: number;

  @IsIn([
    [
      "pending",
      "accepted",
      "rejected",
      "updated",
      "cancelled",
      "waiting_refund",
    ],
  ])
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  status: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  read: boolean;

  @Column({
    type: DataType.STRING,
    // allowNull: false,
  })
  remark: string;

  @BelongsTo(() => Order)
  orderDetails: Order;

  @BelongsTo(() => OrderItems)
  orderItemDetails: OrderItems;

  @HasMany(() => SubstituteProducts)
  substituteProducts: SubstituteProducts[];
}
