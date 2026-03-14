// order/order.entity.ts

import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
  HasOne,
  ForeignKey,
  BelongsTo,
  IsIn,
} from "sequelize-typescript";
import { OrderItems } from "../ORDER_ITEMS/order_items.entity";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { User } from "../USERS/user.entity";
import { Store } from "../STORE/store.entity";
import { StoreReview } from "../STORE_REVIEW/storereview.entity";
import { OrderItem } from "sequelize";
import { OrderSubstitution } from "../ORDER_SUBSTITUTION/substitution.entity";
import { DeliveryCompany } from "../DELIVERY_COMPANY/delivery_company.entity";

@Table({ tableName: "ORDER" })
export class Order extends Model<Order> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  // ✅ CHANGED: Made nullable for guest orders
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  userId: number;

  // order/order.entity.ts

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: "True if order is part of a multi-seller checkout",
  })
  is_multi_seller: boolean;

  // ✅ CHANGED: Made nullable for guest orders (they don't have saved addresses)
  @Column({ type: DataType.INTEGER, allowNull: true })
  addressId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  storeId: number;

  @ForeignKey(() => DeliveryCompany)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    comment: "Assigned delivery company",
  })
  delivery_company_id: number;

  @Column({
    type: DataType.BIGINT,
    unique: true,
    allowNull: false,
    defaultValue: () => Math.round(+new Date() / 10),
  })
  order_id: number;

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
        "picked_up",
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
      const total = totalPrice + tax - discount;
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

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment:
      "Order OTP for delivery verification - auto-generated when customer places order",
  })
  order_otp: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment:
      "Pickup code for store pickup verification - auto-generated when customer places order",
  })
  pickup_code: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Product image URL uploaded during pickup",
  })
  pickup_image: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "Description provided during pickup",
  })
  pickup_description: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Image URL uploaded during delivery confirmation",
  })
  delivery_image: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "Description provided during delivery confirmation",
  })
  delivery_description: string;

  // ==================== GUEST ORDER FIELDS (NEW) ====================

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: "True if this order was placed by a guest user (no account)",
  })
  is_guest_order: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Guest user email address",
  })
  guest_email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Guest user first name",
  })
  guest_first_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Guest user last name",
  })
  guest_last_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Guest user phone number",
  })
  guest_phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Guest user country code (e.g., +234)",
  })
  guest_country_code: string;

  // Delivery Address Fields (inline for guest orders)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Delivery recipient full name",
  })
  delivery_full_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Delivery contact phone number",
  })
  delivery_phone: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "Full delivery address (for guest orders)",
  })
  delivery_address: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Delivery city",
  })
  delivery_city: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Delivery state/province name",
  })
  delivery_state: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: "Delivery state ID (foreign key reference)",
  })
  delivery_state_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Delivery country name",
  })
  delivery_country: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: "Delivery country ID (foreign key reference)",
  })
  delivery_country_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Delivery address landmark",
  })
  delivery_landmark: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Address type: Home, Office, Other",
  })
  delivery_address_type: string;

  // Payment & Metadata for Guest Orders
  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Payment reference number",
  })
  payment_reference: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Payment gateway transaction reference",
  })
  transaction_reference: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "Order notes from customer",
  })
  order_notes: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Preferred delivery time window",
  })
  preferred_delivery_time: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Order source: web, mobile_app, etc.",
  })
  order_source: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Device ID for guest session tracking",
  })
  device_id: string;

  // ==================== RELATIONSHIPS ====================

  @BelongsTo(() => User)
  userDetails: User;

  @BelongsTo(() => Store, { foreignKey: "storeId", constraints: false })
  storeDetails: Store;

  @BelongsTo(() => DeliveryCompany, {
    foreignKey: "delivery_company_id",
    constraints: false,
  })
  deliveryCompany: DeliveryCompany;

  @HasOne(() => OrderPayments, { onDelete: "cascade", hooks: true })
  orderPayment: OrderPayments;

  @HasMany(() => OrderStatus, { onDelete: "cascade", hooks: true })
  orderStatus: OrderStatus[];

  @HasMany(() => OrderItems, { onDelete: "cascade", hooks: true })
  orderItems: OrderItem[];

  @HasMany(() => OrderSubstitution)
  orderSubstitution: OrderSubstitution[];

  @HasOne(() => StoreReview)
  storeReviews: StoreReview;
}
