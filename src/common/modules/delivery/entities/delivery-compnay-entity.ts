// src/modules/delivery-company/entities/delivery-company.entity.ts
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
import { Driver } from '../../drivers/entities/driver.entity';
import { Order } from '../../orders/entities/order-entity';
import { SubscriptionStatus } from '../../../enums/subscription-status.enums';

@Table({
  tableName: 'delivery_companies',
  timestamps: true,
})
export class DeliveryCompany extends Model<DeliveryCompany> {
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

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  companyName: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of routes/areas covered',
  })
  routes: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  logo: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Array of document URLs',
  })
  documents: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  registrationNumber: string;

  @Column({
    type: DataType.ENUM(...Object.values(SubscriptionStatus)),
    defaultValue: SubscriptionStatus.FREE_TRIAL,
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  subscriptionExpiresAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  freeTrialEndsAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  // Relationships
  @BelongsTo(() => User)
  user: User;

  @HasMany(() => Driver)
  drivers: Driver[];

  @HasMany(() => Order)
  orders: Order[];
}


