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
  IsEmail,
} from "sequelize-typescript";
import { Store } from "../STORE/store.entity";
import { User } from "../USERS/user.entity";

@Table({ tableName: "PAYSTACK_SUBACCOUNTS" })
export class PaystackSubaccount extends Model<PaystackSubaccount> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column(DataType.BIGINT)
  store_id: number;

  @Index
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  subaccount_code: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true,
  })
  paystack_subaccount_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  business_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  settlement_bank: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  settlement_account_number: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  settlement_account_name: string;

  @Column({
    type: DataType.DECIMAL(5, 2),
    defaultValue: 95.0,
  })
  percentage_charge: number;

  @Column({
    type: DataType.STRING(50),
    defaultValue: "pending",
  })
  status: string;

  @Column({
    type: DataType.STRING(50),
    defaultValue: "pending",
  })
  admin_approval_status: string;

  @Column(DataType.BIGINT)
  admin_approved_by: number;

  @Column(DataType.DATE)
  admin_approved_at: Date;

  @Column(DataType.JSON)
  paystack_response: JSON;

  @IsEmail
  @Column(DataType.STRING)
  primary_contact_email: string;

  @Column(DataType.STRING)
  primary_contact_name: string;

  @Column(DataType.STRING(50))
  primary_contact_phone: string;

  @Column({
    type: DataType.STRING(50),
    defaultValue: "auto",
  })
  settlement_schedule: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_active: boolean;

  @BelongsTo(() => Store, { foreignKey: "store_id", constraints: false })
  store: Store;

  @BelongsTo(() => User, {
    foreignKey: "admin_approved_by",
    constraints: false,
  })
  approver: User;
}
