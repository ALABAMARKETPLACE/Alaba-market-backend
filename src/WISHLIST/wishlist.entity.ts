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
import { User } from "../USERS/user.entity";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";

@Table({ tableName: "WISHLIST" })
export class Wishlist extends Model<Wishlist> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: "key" })
  userId: number;

  @ForeignKey(() => Products)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: "key" })
  productId: any;

  @ForeignKey(() => ProductVariant)
  @Column({ type: DataType.INTEGER, allowNull: true, unique: "key" })
  variantId: number;

  @BelongsTo(() => Products)
  productDetails: Products;

  @BelongsTo(() => ProductVariant)
  variantDetails: ProductVariant;

  @BelongsTo(() => User)
  userDetails: User;
}
