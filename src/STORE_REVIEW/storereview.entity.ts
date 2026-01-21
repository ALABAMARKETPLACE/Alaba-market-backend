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
import { User } from "../USERS/user.entity";
import { Store } from "../STORE/store.entity";
import { Order } from "../ORDER/order.entity";
import { Print } from "../PRINT/print.entity";

@Table({ tableName: "STORE_REVIEW" })
export class StoreReview extends Model<StoreReview> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Store)
  @Column({ type: DataType.INTEGER, allowNull: false })
  storeId: number | any;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number | any;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  orderId: number;

  @ForeignKey(() => Print)
  @Column({ type: DataType.INTEGER, allowNull: true })
  printId: number | null;

  @Column({
    type: DataType.INTEGER,
    validate: {
      max: 5,
      min: 0,
    },
    allowNull: false,
  })
  rating: number;

  @Column({ type: DataType.STRING })
  remark: string;

  @BelongsTo(() => User, { onDelete: "cascade", hooks: true })
  userDetails: User;

  @BelongsTo(() => Store, { onDelete: "cascade", hooks: true })
  storeDetails: Store;

  @BelongsTo(() => Order, { onDelete: "cascade", hooks: true })
  orderDetails: Order;

  @BelongsTo(() => Print, { onDelete: "cascade", hooks: true })
  printDetails: Print;
}
