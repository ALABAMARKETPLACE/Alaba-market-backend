import { UUID } from "crypto";
import { DataTypes } from "sequelize";
import {
  AutoIncrement,
  Column,
  DataType,
  HasMany,
  IsIn,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Order } from "../ORDER/order.entity";
import { Products } from "../PRODUCTS/products.entity";

@Table({ tableName: "STORE" })
export class Store extends Model<Store> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column(DataType.STRING)
  first_name: string;

  @Column(DataType.STRING)
  last_name: string;

  @Column(DataType.STRING)
  name: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  phone: string;

  @Column(DataType.STRING)
  code: string;

  @Column(DataType.STRING)
  password: string;

  @Column(DataType.STRING)
  business_location: string;

  @Column(DataType.STRING)
  business_address: string;

  @Column(DataType.STRING)
  business_type: string;

  @Column(DataType.STRING)
  agreement: string;

  @Column(DataType.STRING)
  trn_number: string;

  @Column(DataType.STRING)
  trade_lisc_no: string;

  @Column(DataType.STRING)
  seller_name: string;

  @Column(DataType.STRING)
  seller_country: string;

  @Column(DataType.STRING)
  birth_country: string;

  @Column({
    type: DataType.DATE,
  })
  dob: Date;

  @Column(DataType.STRING)
  id_proof: string;

  @Column(DataType.STRING)
  id_type: string;

  @Column(DataType.STRING)
  id_issue_country: string;

  @Column(DataType.DATE)
  id_expiry_date: Date;

  @Column(DataType.STRING)
  store_name: string;

  @Column(DataType.STRING)
  upscs: string;

  @Column(DataType.STRING)
  manufacture: string;

  @Column(DataType.STRING)
  trn_upload: string;

  @Column(DataType.STRING)
  logo_upload: string;

  @IsIn({
    msg: "Invalid Status, Only Approve or Reject is Allowed",
    args: [["approved", "rejected", "pending", "cancelled", "inactive"]],
  })
  @Column({ type: DataType.STRING })
  status: string;

  @Column(DataType.STRING)
  status_remark: string;

  @Column(DataType.DOUBLE)
  lat: number;

  @Column(DataType.DOUBLE)
  long: number;

  @Column({ type: DataType.BIGINT, defaultValue: 0 })
  order_count: number;

  @Column(DataType.JSON)
  business_types: JSON;

  @Column({ type: DataType.STRING(50), unique: true, allowNull: false })
  slug: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true })
  default: boolean;

  @Column({
    type: DataType.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  })
  sid: UUID;

  @Column({ type: DataType.INTEGER, defaultValue: 2 })
  delivery_period: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  delivery_period_minutes: number;

  @Column({ type: DataType.STRING(150) })
  cover_image: string;

  @Column({ type: DataType.FLOAT, defaultValue: 0 })
  averageRating: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  ratings: number;

  @Column({ type: DataType.STRING })
  description: string;

  @Column({ type: DataType.STRING(20) })
  from: string;

  @Column({ type: DataType.STRING(20) })
  to: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  auto_approve_refund: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: true })
  allow_refund: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_prind_available: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  fcmtoken: string;

  @Column({ type: DataType.BIGINT, allowNull: true })
  subscription_plan_id: number;

  @Column({ type: DataType.STRING, allowNull: true })
  account_name_or_code: string;

  @Column({ type: DataType.STRING, allowNull: true })
  account_number: string;

  @Column({ type: DataType.STRING, defaultValue: "standard" })
  subscription_plan: string;

  @Column({ type: DataType.STRING, defaultValue: "Standard Seller" })
  subscription_plan_name: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  subscription_price: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  subscription_boosts: number;

  // Paystack Subaccount Fields
  @Column({ type: DataType.STRING, allowNull: true })
  paystack_subaccount_code: string;

  @Column({ type: DataType.STRING, allowNull: true })
  paystack_subaccount_code_old: string;

  @Column({ type: DataType.STRING, allowNull: true })
  paystack_subaccount_code_new: string;

  @Column({ type: DataType.BIGINT, allowNull: true })
  paystack_subaccount_id: number;

  @Column({ type: DataType.DATE, allowNull: true })
  paystack_subaccount_migrated_at: Date;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: "pending, success, failed",
  })
  paystack_subaccount_migration_status: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  paystack_subaccount_migration_error: string;

  @Column({ 
    type: DataType.STRING(50), 
    defaultValue: "pending",
    comment: "pending, approved, rejected, active, suspended"
  })
  subaccount_status: string;

  @Column({ type: DataType.STRING, allowNull: true })
  settlement_bank: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  settlement_account_number: string;

  @Column({ type: DataType.STRING, allowNull: true })
  settlement_account_name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  business_name: string;

  @Column({ 
    type: DataType.DECIMAL(5, 2), 
    defaultValue: 93.5,
    comment: "Seller percentage (Admin gets 6.5%)"
  })
  percentage_charge: number;

  @Column({ type: DataType.STRING, allowNull: true })
  primary_contact_email: string;

  @Column({ type: DataType.STRING, allowNull: true })
  primary_contact_name: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  primary_contact_phone: string;

  // BudPay seller payout profile / dedicated virtual account fields.
  // BudPay does not currently document Paystack-style split subaccounts.
  @Column({ type: DataType.BIGINT, allowNull: true })
  budpay_subaccount_id: number;

  @Column({ type: DataType.STRING, allowNull: true })
  budpay_subaccount_code: string;

  @Column({ type: DataType.BIGINT, allowNull: true })
  budpay_customer_id: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  budpay_virtual_account_id: number;

  @Column({ type: DataType.STRING(50), allowNull: true })
  budpay_account_number: string;

  @Column({ type: DataType.STRING, allowNull: true })
  budpay_bank_name: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: "pending",
  })
  budpay_import_status: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  budpay_import_error: string;

  @Column({ type: DataType.DATE, allowNull: true })
  budpay_imported_at: Date;

  @Column({ type: DataType.JSONB, allowNull: true })
  budpay_raw_response: any;

  @Column({ 
    type: DataType.STRING(50), 
    defaultValue: "auto",
    comment: "auto, weekly, monthly"
  })
  settlement_schedule: string;

  @HasMany(() => Products, { foreignKey: 'store_id', constraints: false })
  productList: Products[];

  @HasMany(() => Order, { foreignKey: 'storeId', constraints: false })
  orders: Order[];
}
