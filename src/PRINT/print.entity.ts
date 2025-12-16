import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  IsIn,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { PrintItems } from "../PRINT_ITEMS/print_items.entity";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { Store } from "../STORE/store.entity";
import { User } from "../USERS/user.entity";
import { PrintConfigeration } from "../PRINT_CONFIGERATION/print_configeration.entity";
import { PrintStatus } from "../PRINT_STATUS/print_status.entity";
import { StoreReview } from "../STORE_REVIEW/storereview.entity";
@Table({ tableName: "PRINT" })
export class Print extends Model<Print> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  addressId: number;

  @ForeignKey(() => Store)
  @Column({ type: DataType.INTEGER, allowNull: false })
  storeId: number;

  @Column({
    type: DataType.BIGINT,
    unique: true,
    allowNull: false,
    defaultValue: () => Math.round(+new Date() / 10),
  })
  print_id: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  totalItems: number;

  @Column({ type: DataType.STRING, allowNull: false })
  paymentType: string;

  @Column(DataType.STRING)
  coupan: string;

  @Column({ type: DataType.DOUBLE, defaultValue: 0 })
  tax: number;

  @Column({ type: DataType.DOUBLE, defaultValue: 0 })
  deliveryCharge: number;

  @Column({ type: DataType.DOUBLE, defaultValue: 0 })
  discount: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  total: number;

  @IsIn({
    msg: "Invalid Order Status@@",
    args: [
      [
        "pending",
        "cancelled",
        "shipped",
        "out_for_delivery",
        "packed",
        "delivered",
        "rejected",
        "processing",
        "failed",
        "substitution",
        "waiting_refund",
      ],
    ],
  })
  @Column({
    type: DataType.STRING,
    defaultValue: "pending",
  })
  status: string;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: 0,
    set(value: number) {
      const totalPrice: number = this.getDataValue("total") || 0;
      const discount: number = this.getDataValue("discount") || 0;
      const tax: number = this.getDataValue("tax") || 0;
      const delivery: number = this.getDataValue("deliveryCharge") || 0;
      const total = totalPrice + tax + delivery - discount;
      this.setDataValue("grandTotal", total);
    },
  })
  grandTotal: number;

  @Column({ type: DataType.DATE })
  delivery_date: Date;

  @Column({ type: DataType.JSON })
  address: JSON;

  @Column({ type: DataType.JSON })
  products: JSON;

  @ForeignKey(() => PrintConfigeration)
  @Column({ type: DataType.BIGINT, allowNull: true })
  printConfigerationId: number;

  @BelongsTo(() => PrintConfigeration)
  printConfiguration: PrintConfigeration;

  @BelongsTo(() => User)
  userDetails: User;

  @BelongsTo(() => Store)
  storeDetails: Store;

  @HasOne(() => OrderPayments, { onDelete: "cascade", hooks: true })
  printPayment: OrderPayments;

  @HasMany(() => PrintStatus, { onDelete: "cascade", hooks: true })
  printStatus: PrintStatus[];

  @HasMany(() => PrintItems, { onDelete: "cascade", hooks: true })
  printItems: PrintItems[];

  @HasOne(() => StoreReview)
  storeReviews: StoreReview;
}
