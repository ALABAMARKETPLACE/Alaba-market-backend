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

@Table({
  tableName: 'trackings',
  timestamps: true,
})
export class Tracking extends Model<Tracking> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  orderId: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  riderId: string;

  @Column({
    type: DataType.ENUM('pending', 'picked_up', 'in_transit', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  })
  status: string;

  @Column({
    type: DataType.DECIMAL(10, 8),
    allowNull: true,
  })
  latitude: number;

  @Column({
    type: DataType.DECIMAL(11, 8),
    allowNull: true,
  })
  longitude: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  address: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  estimatedDeliveryTime: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  actualDeliveryTime: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
