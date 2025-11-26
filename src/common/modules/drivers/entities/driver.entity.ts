// src/modules/drivers/entities/driver.entity.ts
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
import { DeliveryCompany } from '../../delivery/entities/delivery-compnay-entity';
import { Order } from '../../orders/entities/order-entity';
import { User } from '../../users/entities/user-entity';

@Table({
  tableName: 'drivers',
  timestamps: true,
})
export class Driver extends Model<Driver> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => DeliveryCompany)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  companyId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  userId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  licenseNumber: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  vehicleNumber: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  photo: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isAvailable: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  // Relationships
  @BelongsTo(() => DeliveryCompany)
  company: DeliveryCompany;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => Order)
  deliveries: Order[];
}
