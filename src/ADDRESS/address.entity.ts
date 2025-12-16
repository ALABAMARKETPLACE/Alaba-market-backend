import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { User } from "../USERS/user.entity";

@Table({ tableName: "ADDRESS" })
export class Address extends Model<Address> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number;

  @Column({ type: DataType.STRING(50), allowNull: false })
  flat: string;

  @Column({ type: DataType.STRING, allowNull: false })
  fullAddress: string;

  @Column({ type: DataType.STRING(20) })
  pin_code: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  state: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  city: string;

  @Column({ type: DataType.STRING(100) })
  country: string;

  @Column({ type: DataType.STRING(100) })
  street: string;

  @Column({ type: DataType.STRING(20) })
  alt_phone: string;

  @Column({ type: DataType.STRING(20) })
  code: string;

  @Column({ type: DataType.STRING(50) })
  type: string;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  lat: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  long: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  default: boolean;

  @BelongsTo(() => User)
  userDetails: User;
}
