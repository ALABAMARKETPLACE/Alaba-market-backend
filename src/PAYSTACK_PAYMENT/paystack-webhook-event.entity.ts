import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";

@Table({ tableName: "PAYSTACK_WEBHOOK_EVENTS" })
export class PaystackWebhookEvent extends Model<PaystackWebhookEvent> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  event_key: string;

  @Column({ type: DataType.STRING, allowNull: false })
  event: string;

  @Column({ type: DataType.STRING, allowNull: true })
  reference: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  paystack_transaction_id: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "processing",
  })
  status: "processing" | "completed" | "failed";

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  attempts: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  payload: any;

  @Column({ type: DataType.TEXT, allowNull: true })
  error: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  processed_at: Date | null;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date;
}
