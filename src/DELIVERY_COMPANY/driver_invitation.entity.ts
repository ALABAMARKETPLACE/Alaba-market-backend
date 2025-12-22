import { UUID } from "crypto";
import { DataTypes } from "sequelize";
import {
  AutoIncrement,
  Column,
  DataType,
  IsIn,
  Model,
  PrimaryKey,
  Table,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import { Driver } from "./driver.entity";
import { DeliveryCompany } from "./delivery_company.entity";

@Table({ tableName: "DRIVER_INVITATION" })
export class DriverInvitation extends Model<DriverInvitation> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Driver)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    comment: "Reference to DRIVER table"
  })
  driver_id: number;

  @BelongsTo(() => Driver, { foreignKey: 'driver_id' })
  driver: Driver;

  @ForeignKey(() => DeliveryCompany)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    comment: "Reference to DELIVERY_COMPANY table"
  })
  delivery_company_id: number;

  @BelongsTo(() => DeliveryCompany, { foreignKey: 'delivery_company_id' })
  delivery_company: DeliveryCompany;

  @IsIn({
    msg: "Invalid Status",
    args: [["pending", "accepted", "rejected", "cancelled"]],
  })
  @Column({
    type: DataType.STRING,
    defaultValue: "pending"
  })
  status: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Who initiated the invitation: 'driver' or 'company'"
  })
  initiated_by: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  message: string;

  @Column({
    type: DataType.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  })
  invitation_id: UUID;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true
  })
  is_active: boolean;
}

