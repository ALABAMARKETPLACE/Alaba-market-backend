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

@Table({ tableName: "USER_BANK_ACCOUNTS" })
export class UserBankAccount extends Model<UserBankAccount> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  accountHolderName: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  bankName: string;

  @Column({ type: DataType.STRING(30), allowNull: false })
  accountNumber: string;

  @Column({ type: DataType.STRING(34), allowNull: false })
  iban: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  accountType: string;

  @Column({ type: DataType.STRING(11) })
  swiftCode: string;

  @Column({ type: DataType.STRING(255) })
  branchName: string;

  @Column({ type: DataType.STRING(255) })
  branchAddress: string;

  @Column({ type: DataType.STRING(20) })
  emiratesId: string;

  @Column({ type: DataType.STRING(20) })
  phoneNumber: string;
  
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isDelete: boolean;

  @Column({ type: DataType.DATE, allowNull: false })
  accountCreationDate: Date;

  @Column({ type: DataType.ENUM("active", "inactive"), allowNull: false })
  status: "active" | "inactive";

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isDefault: boolean;

  @BelongsTo(() => User)
  userDetails: User;
}
