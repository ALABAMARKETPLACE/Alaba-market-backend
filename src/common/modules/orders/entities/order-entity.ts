// =====================================================
// FILE 3: backend/src/modules/orders/entities/order.entity.ts
// =====================================================
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user-entity';
import { Product } from '../../products/entities/products-entity';
import { DeliveryCompany } from '../../delivery/entities/delivery-compnay-entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { DeliveryLog } from '../../delivery/entities/delivery-log.entity';
import { OrderStatus } from '../../../enums/order-status';
import { PaymentStatus } from '../../../enums/payment-status-enums';

@Table({
  tableName: 'orders',
  timestamps: true,
})
export class Order extends Model<Order> {
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
  buyerId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  sellerId: string;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  productId: string;

  @ForeignKey(() => DeliveryCompany)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  deliveryCompanyId: string;

  @ForeignKey(() => Driver)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  driverId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  quantity: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  unitPrice: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  totalPrice: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
  })
  deliveryFee: number;

  @Column({
    type: DataType.ENUM(...Object.values(OrderStatus)),
    defaultValue: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    defaultValue: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  paystackReference: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
    comment: 'Short barcode for package identification (8-10 chars)',
  })
  barcodeShortCode: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
    comment: 'Delivery confirmation code (sent to buyer & seller)',
  })
  deliveryCode: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  selectedRoute: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  deliveryAddress: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  deliveryCity: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  deliveryState: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: [],
    comment: 'Array of tracking history',
  })
  trackingHistory: Array<{
    status: string;
    timestamp: Date;
    remarks?: string;
  }>;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deliveredAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  assignedAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  // Relationships
  @BelongsTo(() => User, 'buyerId')
  buyer: User;

  @BelongsTo(() => User, 'sellerId')
  seller: User;

  @BelongsTo(() => Product)
  product: Product;

  @BelongsTo(() => DeliveryCompany)
  deliveryCompany: DeliveryCompany;

  @BelongsTo(() => Driver)
  driver: Driver;

  @HasMany(() => DeliveryLog)
  logs: DeliveryLog[];
}