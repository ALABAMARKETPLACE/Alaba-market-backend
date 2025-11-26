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
import { Order } from '../../orders/entities/order-entity';

@Table({
  tableName: 'delivery_logs',
  timestamps: true,
})
export class DeliveryLog extends Model<DeliveryLog> {
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
  deliveryId: string; // optionally add ForeignKey if needed

  @ForeignKey(() => Order)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  orderId: string;

  @BelongsTo(() => Order)
  order: Order;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  driverId: string;

  @Column({
    type: DataType.ENUM(
      'created',
      'assigned',
      'accepted',
      'rejected',
      'picked_up',
      'in_transit',
      'arrived',
      'delivered',
      'failed',
      'cancelled',
      'returned'
    ),
    allowNull: false,
  })
  status: string;

  @Column({
    type: DataType.ENUM(
      'status_change',
      'location_update',
      'driver_assignment',
      'note_added',
      'issue_reported',
      'photo_uploaded',
      'signature_captured',
      'payment_collected',
      'other'
    ),
    allowNull: false,
    defaultValue: 'status_change',
  })
  action: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @Column({ type: DataType.DECIMAL(10, 8), allowNull: true })
  latitude: number;

  @Column({ type: DataType.DECIMAL(11, 8), allowNull: true })
  longitude: number;

  @Column({ type: DataType.STRING, allowNull: true })
  address: string;

  @Column({ type: DataType.UUID, allowNull: true })
  performedBy: string;

  @Column({
    type: DataType.ENUM('system', 'driver', 'customer', 'admin', 'automated'),
    defaultValue: 'system',
  })
  performedByType: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  metadata: object;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  attachments: string[];

  @Column({ type: DataType.STRING, allowNull: true })
  ipAddress: string;

  @Column({ type: DataType.STRING, allowNull: true })
  userAgent: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  estimatedTime: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  actualTime: number;

  @Column({ type: DataType.DATE, allowNull: true })
  timestamp: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
