import {
  AutoIncrement,
  Column,
  DataType,
  Index,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({
  tableName: "ADMIN_AUDIT_LOGS",
  timestamps: false,
})
export class AdminAuditLog extends Model<AdminAuditLog> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Index
  @Column({ type: DataType.INTEGER, allowNull: false })
  actor_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  actor_role: string;

  @Index
  @Column({ type: DataType.INTEGER, allowNull: true })
  target_user_id: number | null;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  action: string;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  module: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  before_data: Record<string, any> | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  after_data: Record<string, any> | null;

  @Column({ type: DataType.STRING, allowNull: true })
  ip_address: string | null;

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;
}
