

// =====================================================
// FILE: backend/src/modules/subscription/entities/subscription.entity.ts
// =====================================================
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
import { DeliveryCompany } from '../../delivery/entities/delivery-compnay-entity';
import { PaymentStatus } from '../../../enums/payment-status-enums';

@Table({
  tableName: 'subscriptions',
  timestamps: true,
})
export class Subscription extends Model<Subscription> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  // Foreign key to delivery company
  @ForeignKey(() => DeliveryCompany)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  companyId: string;

  // User who owns the subscription
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount: number;

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
    allowNull: false,
  })
  planType: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'active',
  })
  status: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  startDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  endDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  nextBillingDate?: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  autoRenew: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isFreeTrial: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  features?: object;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  // Relationships
  @BelongsTo(() => DeliveryCompany)
  company: DeliveryCompany;
}
