import { IsEnum } from "class-validator";
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
} from "sequelize-typescript";
import { PrintItems } from "../PRINT_ITEMS/print_items.entity";

@Table({ tableName: "PRINT_CONFIGERATION" })
export class PrintConfigeration extends Model<PrintConfigeration> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column(DataType.STRING)
  printType: string;

  @IsEnum(["blackandwhite", "color"], {
    message: "Print color must be one of: blackandwhite, color",
  })
  @Column(DataType.ENUM("blackandwhite", "color"))
  printColor: "blackandwhite" | "color";

  @Column(DataType.BOOLEAN)
  doublesided: boolean;

  @Column(DataType.INTEGER)
  amount: number;

  @HasMany(() => PrintItems, { onDelete: "RESTRICT", hooks: true })
   products: PrintItems[];

}
