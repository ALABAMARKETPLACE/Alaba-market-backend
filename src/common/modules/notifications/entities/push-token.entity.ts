import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user-entity';

@Table({
  tableName: 'push_tokens',
  timestamps: true,
  underscored: true,
})
export class PushToken extends Model<PushToken> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_id',
  })
  userId: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  token: string;

  @Column({
    type: DataType.ENUM('ios', 'android'),
    allowNull: false,
    field: 'device_type',
  })
  deviceType: 'ios' | 'android';

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
  })
  isActive: boolean;

  @CreatedAt
  @Column({
    field: 'created_at',
  })
  createdAt: Date;

  @UpdatedAt
  @Column({
    field: 'updated_at',
  })
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User;
}
