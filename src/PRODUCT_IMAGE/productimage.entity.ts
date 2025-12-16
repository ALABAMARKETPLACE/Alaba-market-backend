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
import { Products } from "../PRODUCTS/products.entity";

@Table({ tableName: "PRODUCT_IMAGE" })
export class ProductImage extends Model<ProductImage> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  url: string;

  @ForeignKey(() => Products)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  type: string;

  @Column({ type: DataType.STRING, allowNull: true })
  Key: string;

  @BelongsTo(() => Products)
  product: Products;
}
