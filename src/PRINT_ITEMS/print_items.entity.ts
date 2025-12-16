import {
  AutoIncrement,
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  IsIn,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Print } from "../PRINT/print.entity";
import { Products } from "../PRODUCTS/products.entity";
import { PrintConfigeration } from "../PRINT_CONFIGERATION/print_configeration.entity";

@Table({ tableName: "PRINT_ITEMS" })
export class PrintItems extends Model<PrintItems> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Print)
  @Column({ type: DataType.INTEGER, allowNull: false })
  printId: number;

  // @ForeignKey(() => Products)
  // @Column({ type: DataType.INTEGER, allowNull: false })
  // productId: number;

  // @Column({ type: DataType.INTEGER, allowNull: true })
  // variantId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  price: number;

  // @Column({ type: DataType.NUMBER })
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  number_of_pages: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
    defaultValue: 0
  })
  totalPrice: number;

  @Column(DataType.STRING)
  image: string;

  @IsIn({
    msg: "Invalid Orientation@@",
    args: [["landscape", "portrait"]],
  })
  @Column({
    type: DataType.STRING,
    defaultValue: "portrait",
  })
  orientation: string;

  // @Column(DataType.STRING)
  // name: string;

  // @Column(DataType.STRING(50))
  // sku: string;

  // @Column(DataType.STRING(50))
  // barcode: string;

  // @Column(DataType.JSON)
  // combination: JSON;

  @ForeignKey(() => PrintConfigeration)
  @Column({ type: DataType.BIGINT, allowNull: true })
  printConfigerationId: number;

  @Column({ type: DataType.STRING })
  name: string;

  @BelongsTo(() => PrintConfigeration, {
    foreignKey: "printConfigerationId",
    as: "printConfiguration",
  })
  printConfiguration: PrintConfigeration;

  @BelongsTo(() => Print)
  printDetails: Print;

  @BeforeCreate
  @BeforeUpdate
  static calculateTotalPrice(instance: PrintItems) {
    const quantity = instance.getDataValue("quantity") || 0;
    const price = instance.getDataValue("price") || 0;
    const number_of_pages = instance.getDataValue("number_of_pages") || 0;
    const total = price * quantity * number_of_pages;
    instance.setDataValue("totalPrice", total);
  }

  // @BelongsTo(() => Products)
  // productDetails: Products;
}
