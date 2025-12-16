import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Index,
} from "sequelize-typescript";
import { Products } from "../PRODUCTS/products.entity";
import { User } from "../USERS/user.entity";

@Table({ tableName: "PRODUCT_REVIEWS" })
export class ProductReviews extends Model<ProductReviews> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  _id: number;

  @ForeignKey(() => Products)
  @Index
  @Column({ type: DataType.INTEGER, allowNull: false, unique: "key" })
  product_id: any;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: "key" })
  user_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  message: string;

  @Column({
    type: DataType.INTEGER,
    validate: {
      max: 5,
      min: 0,
    },
    allowNull: false,
  })
  rating: number;

  @BelongsTo(() => Products)
  productDetails: Products;

  @BelongsTo(() => User)
  userDetails: User;
}
