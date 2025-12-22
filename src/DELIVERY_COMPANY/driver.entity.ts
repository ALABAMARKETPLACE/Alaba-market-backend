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
import { User } from "../USERS/user.entity";

@Table({ tableName: "DRIVER" })
export class Driver extends Model<Driver> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    comment: "Reference to USER table"
  })
  user_id: number;

  @BelongsTo(() => User, { foreignKey: 'user_id', targetKey: '_id' })
  user: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  full_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  state: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  city: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  license_number: string;

  @IsIn({
    msg: "Invalid Status",
    args: [["pending", "approved", "rejected", "active", "suspended", "inactive"]],
  })
  @Column({
    type: DataType.STRING,
    defaultValue: "pending"
  })
  status: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  status_remark: string;

  @Column({
    type: DataType.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  })
  drid: UUID;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true
  })
  is_active: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  vehicle_type: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  vehicle_number: string;
}
