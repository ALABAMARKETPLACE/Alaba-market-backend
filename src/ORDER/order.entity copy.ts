// import {
//   Table,
//   Column,
//   Model,
//   DataType,
//   PrimaryKey,
//   AutoIncrement,
//   HasMany,
//   HasOne,
//   ForeignKey,
//   BelongsTo,
//   IsIn,
// } from "sequelize-typescript";
// import { OrderItems } from "../ORDER_ITEMS/order_items.entity";
// import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
// import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
// import { User } from "../USERS/user.entity";
// // Address is now stored as JSON in the order, not as a relation
// import { Store } from "../STORE/store.entity";
// import { StoreReview } from "../STORE_REVIEW/storereview.entity";
// import { OrderItem } from "sequelize";
// import { OrderSubstitution } from "../ORDER_SUBSTITUTION/substitution.entity";
// import { DeliveryCompany } from "../DELIVERY_COMPANY/delivery_company.entity";
// @Table({ tableName: "ORDER" })
// export class Order extends Model<Order> {
//   @PrimaryKey
//   @AutoIncrement
//   @Column(DataType.BIGINT)
//   id: number;

//   @ForeignKey(() => User)
//   @Column({ type: DataType.INTEGER, allowNull: false })
//   userId: number;

//   @Column({ type: DataType.INTEGER, allowNull: false })
//   addressId: number;

//   @Column({ type: DataType.INTEGER, allowNull: false })
//   storeId: number;

//   @ForeignKey(() => DeliveryCompany)
//   @Column({
//     type: DataType.BIGINT,
//     allowNull: true,
//     comment: "Assigned delivery company",
//   })
//   delivery_company_id: number;

//   @Column({
//     type: DataType.BIGINT,
//     unique: true,
//     allowNull: false,
//     defaultValue: () => Math.round(+new Date() / 10),
//   })
//   order_id: number;

//   @Column({ type: DataType.INTEGER, defaultValue: 0 })
//   totalItems: number;

//   @Column({ type: DataType.STRING, allowNull: false })
//   paymentType: string;

//   @Column(DataType.STRING)
//   coupan: string;

//   @Column({ type: DataType.DOUBLE, defaultValue: 0 })
//   tax: number;

//   @Column({ type: DataType.DOUBLE, defaultValue: 0 })
//   deliveryCharge: number;

//   @Column({ type: DataType.DOUBLE, defaultValue: 0 })
//   discount: number;

//   @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
//   total: number;

//   @IsIn({
//     msg: "Invalid Order Status@@",
//     args: [
//       [
//         "pending",
//         "cancelled",
//         "shipped",
//         "out_for_delivery",
//         "packed",
//         "delivered",
//         "rejected",
//         "processing",
//         "failed",
//         "substitution",
//         "waiting_refund",
//         "picked_up",
//       ],
//     ],
//   })
//   @Column({
//     type: DataType.STRING,
//     defaultValue: "pending",
//   })
//   status: string;

//   @Column({
//     type: DataType.DOUBLE,
//     defaultValue: 0,
//     set(value: number) {
//       const totalPrice: number = this.getDataValue("total") || 0;
//       const discount: number = this.getDataValue("discount") || 0;
//       const tax: number = this.getDataValue("tax") || 0;
//       const delivery: number = this.getDataValue("deliveryCharge") || 0;
//       const total = totalPrice + tax + delivery - discount;
//       this.setDataValue("grandTotal", total);
//     },
//   })
//   grandTotal: number;

//   @Column({ type: DataType.DATE })
//   delivery_date: Date;

//   @Column({ type: DataType.JSON })
//   address: JSON;

//   @Column({ type: DataType.JSON })
//   products: JSON;

//   @Column({
//     type: DataType.STRING,
//     allowNull: true,
//     comment:
//       "Order OTP for delivery verification - auto-generated when customer places order",
//   })
//   order_otp: string;

//   @Column({
//     type: DataType.STRING,
//     allowNull: true,
//     comment:
//       "Pickup code for store pickup verification - auto-generated when customer places order",
//   })
//   pickup_code: string;

//   @Column({
//     type: DataType.STRING,
//     allowNull: true,
//     comment: "Product image URL uploaded during pickup",
//   })
//   pickup_image: string;

//   @Column({
//     type: DataType.TEXT,
//     allowNull: true,
//     comment: "Description provided during pickup",
//   })
//   pickup_description: string;

//   @Column({
//     type: DataType.STRING,
//     allowNull: true,
//     comment: "Image URL uploaded during delivery confirmation",
//   })
//   delivery_image: string;

//   @Column({
//     type: DataType.TEXT,
//     allowNull: true,
//     comment: "Description provided during delivery confirmation",
//   })
//   delivery_description: string;

//   @BelongsTo(() => User)
//   userDetails: User;

//   @BelongsTo(() => Store, { foreignKey: "storeId", constraints: false })
//   storeDetails: Store;

//   @BelongsTo(() => DeliveryCompany, {
//     foreignKey: "delivery_company_id",
//     constraints: false,
//   })
//   deliveryCompany: DeliveryCompany;

//   @HasOne(() => OrderPayments, { onDelete: "cascade", hooks: true })
//   orderPayment: OrderPayments;

//   @HasMany(() => OrderStatus, { onDelete: "cascade", hooks: true })
//   orderStatus: OrderStatus[];

//   @HasMany(() => OrderItems, { onDelete: "cascade", hooks: true })
//   orderItems: OrderItem[];

//   @HasMany(() => OrderSubstitution)
//   orderSubstitution: OrderSubstitution[];

//   @HasOne(() => StoreReview)
//   storeReviews: StoreReview;

//   // GUEST USER RELATED ADDONS BELOW
// }
