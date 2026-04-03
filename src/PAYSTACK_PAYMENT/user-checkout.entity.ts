import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";

@Table({ tableName: "USER_CHECKOUT" })
export class UserCheckout extends Model<UserCheckout> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  reference: string;

  @Column({ type: DataType.BIGINT, allowNull: false })
  user_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  user_email: string;

  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  amount_kobo: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  payload: any;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "initialized",
  })
  status: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "pending",
  })
  payment_status: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  order_ids: any;

  @Column({ type: DataType.JSONB, allowNull: true })
  webhook_payload: any;

  @Column({ type: DataType.TEXT, allowNull: true })
  error: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  processed_at: Date;
}
