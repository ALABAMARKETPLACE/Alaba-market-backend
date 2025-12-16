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
import { Print } from "../PRINT/print.entity";

@Table({ tableName: "PRINT_STATUS" })
export class PrintStatus extends Model<PrintStatus> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  
  @ForeignKey(() => Print)
  @Column({ type: DataType.INTEGER, allowNull: false })
  printId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  status: string;

  @Column(DataType.STRING)
  remark: string;

  @BelongsTo(() => Print)
  printDetails: Print;
}
