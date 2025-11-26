// =====================================================
// FILE 2: backend/src/modules/products/entities/product.entity.ts
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
import { Order } from '../../orders/entities/order-entity';

@Table({
  tableName: 'products',
  timestamps: true,
})
export class Product extends Model<Product> {
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
  sellerId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  price: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  stock: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Array of image URLs',
  })
  images: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  category: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true,
  })
  sku: string;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  weight: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Dimensions {length, width, height}',
  })
  dimensions: { length: number; width: number; height: number };

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
  seller: User;

  @HasMany(() => Order)
  orders: Order[];
}