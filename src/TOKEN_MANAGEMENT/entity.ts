import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { User } from "../USERS/user.entity";

@Table({ tableName: "TOKEN_MANAGEMENT", timestamps: false })
export class TokenManagement extends Model<TokenManagement> {
  @PrimaryKey
  @Column({
    type: DataType.BIGINT,
    defaultValue: (max = 999999999999, min = 900000000000) =>
      Math.floor(Math.random() * (max - min + 1)) + min,
  })
  otp: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
    defaultValue: (max = 599999999, min = 100000000) =>
      Math.floor(Math.random() * (max - min + 1)) + min,
  })
  fid: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @BelongsTo(() => User)
  userDetails: User;
}
