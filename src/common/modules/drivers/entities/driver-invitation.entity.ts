import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript'
import { DeliveryCompany } from '../../delivery/entities/delivery-compnay-entity'
import { User } from '../../users/entities/user-entity'

@Table({
  tableName: 'driver_invitations',
  timestamps: true,
})
export class DriverInvitation extends Model<DriverInvitation> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string

  @ForeignKey(() => DeliveryCompany)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  companyId: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  driverUserId: string

  @Column({
    type: DataType.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
  })
  status: 'pending' | 'accepted' | 'rejected'

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  message: string | null

  @BelongsTo(() => DeliveryCompany)
  company: DeliveryCompany

  @BelongsTo(() => User)
  driverUser: User

  @CreatedAt
  createdAt: Date

  @UpdatedAt
  updatedAt: Date
}
