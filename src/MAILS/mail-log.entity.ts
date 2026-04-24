import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";

@Table({ tableName: "MAIL_LOG" })
export class MailLog extends Model<MailLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  to: string;

  @Column({ type: DataType.STRING, allowNull: false })
  subject: string;

  @Column({ type: DataType.STRING, allowNull: false })
  provider: string;

  @Column({ type: DataType.STRING, allowNull: false })
  status: string;

  @Column({ type: DataType.STRING, allowNull: true })
  context: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  error: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  payload: JSON;
}
