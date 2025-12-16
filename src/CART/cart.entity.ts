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
import { Store } from "../STORE/store.entity";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { User } from "../USERS/user.entity";

@Table({
  tableName: "CART",
})
export class CartTable extends Model<CartTable> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number;

  @ForeignKey(() => Products)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId: any;

  @ForeignKey(() => ProductVariant)
  @Column({ type: DataType.INTEGER, allowNull: true })
  variantId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 25,
    },
  })
  quantity: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  buyPrice: any;

  @BelongsTo(() => Products)
  productDetails: Products;

  @BelongsTo(() => ProductVariant)
  variantDetails: ProductVariant;

  @BelongsTo(() => User)
  userDetails: User;
}
