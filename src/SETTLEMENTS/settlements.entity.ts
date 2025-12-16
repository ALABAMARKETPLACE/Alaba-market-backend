import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  IsIn,
  Index,
  Default,
} from "sequelize-typescript";
import { Store } from "../STORE/store.entity";
import { UserBankAccount } from "../USER_BANK_ACCOUNTS/user_bank_accounts.entity";

@Table({ tableName: "SETTLEMENS" })
export class Settlements extends Model<Settlements> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Index
  @ForeignKey(() => Store)
  @Column({ type: DataType.INTEGER, allowNull: false })
  storeId: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  total: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  balance: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  paid: number;

  @Index
  @IsIn({
    msg: "Invalid Settlement Status@@",
    args: [["pending", "requested", "success", "cancelled"]],
  })
  @Default("requested")
  @Column({ type: DataType.STRING, allowNull: false })
  status: string;

  @Column({ type: DataType.STRING, allowNull: false })
  payment_type: string;

  @Column({ type: DataType.STRING })
  remark: string;

  @Index
  @ForeignKey(() => UserBankAccount)
  @Column({ type: DataType.INTEGER, allowNull: true })
  user_bank_id: number;
  @BelongsTo(() => Store)
  storeDetails: Store;

  @BelongsTo(() => UserBankAccount)
  bankDetails: UserBankAccount;
}
