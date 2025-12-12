import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user-entity';

@Table({
  tableName: 'notifications',
  timestamps: true,
})
export class Notification extends Model<Notification> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  message: string;

  @Column({
    type: DataType.ENUM('order', 'driver', 'system', 'payment', 'invitation', 'alert'),
    allowNull: false,
  })
  type: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isRead: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  actionUrl: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  data: Record<string, any>;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
