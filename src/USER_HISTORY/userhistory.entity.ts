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

@Table({ tableName: "USER_HISTORY" })
export class UserHistory extends Model<UserHistory> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Index
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: "key" })
  userId: number;

  @ForeignKey(() => Products)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: "key" })
  productId: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  variantId: number;

  @BelongsTo(() => Products)
  productDetails: Products;

  @BelongsTo(() => User)
  userDetails: User;
}
