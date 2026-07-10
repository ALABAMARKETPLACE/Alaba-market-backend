import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "ADMIN_AUDIT_LOGS", updatedAt: false })
export class AdminAuditLog extends Model<AdminAuditLog> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column({ type: DataType.BIGINT, allowNull: false })
  actor_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  actor_role: string;

  @Column({ type: DataType.BIGINT, allowNull: true })
  target_user_id: number | null;

  @Column({ type: DataType.STRING, allowNull: false })
  action: string;

  @Column({ type: DataType.STRING, allowNull: false })
  module: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  before_data: Record<string, any> | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  after_data: Record<string, any> | null;

  @Column({ type: DataType.STRING, allowNull: true })
  ip_address: string | null;

  @CreatedAt
  @Column(DataType.DATE)
  created_at: Date;
}
