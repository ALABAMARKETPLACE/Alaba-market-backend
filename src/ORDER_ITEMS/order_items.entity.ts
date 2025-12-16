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
import { Products } from "../PRODUCTS/products.entity";

@Table({ tableName: "ORDER_ITEMS" })
export class OrderItems extends Model<OrderItems> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false })
  orderId: number;

  @ForeignKey(() => Products)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  variantId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  price: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
    defaultValue: 0,
    set(value: number) {
      const quantity: number = this.getDataValue("quantity") || 0;
      const price: number = this.getDataValue("price") || 0;
      const total = price * quantity;
      this.setDataValue("totalPrice", total);
    },
  })
  totalPrice: number;

  @Column(DataType.STRING)
  image: string;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING(50))
  sku: string;

  @Column(DataType.STRING(50))
  barcode: string;

  @Column(DataType.JSON)
  combination: JSON;

  @BelongsTo(() => Order)
  orderDetails: Order;

  @BelongsTo(() => Products)
  productDetails: Products;
}
