import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';

@Table({
  tableName: 'driver_locations',
  timestamps: true,
  indexes: [
    {
      fields: ['driverId'],
      unique: true,
    },
    {
      fields: ['orderId'],
    },
  ],
})
export class DriverLocation extends Model<DriverLocation> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
    unique: true,
  })
  driverId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  driverName: string;

  @Index
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  orderId: string;

  @Column({
    type: DataType.DECIMAL(10, 8),
    allowNull: false,
  })
  latitude: number;

  @Column({
    type: DataType.DECIMAL(11, 8),
    allowNull: false,
  })
  longitude: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  accuracy: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  heading: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  speed: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  address: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
