import { NOW } from "sequelize";
import {
  AutoIncrement,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { InvoiceItems } from "../INVOICE_ITEMS/invoiceitems.entity";

@Table({ tableName: "INVOICE" })
export class Invoice extends Model<Invoice> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  from_mail: string;

  @Column({ type: DataType.STRING, allowNull: false })
  to_mail: string;

  @Column({ type: DataType.STRING })
  from_name: string;

  @Column({ type: DataType.STRING })
  to_name: string;

  @Column({ type: DataType.DATE, allowNull: false })
  due_date: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  issue_date: Date;

  @Column({ type: DataType.STRING })
  invoice_address: string;

  @Column({ type: DataType.STRING, allowNull: false })
  delivery_address: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  invoice_id: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  total_quantity: number;

  @Column({ type: DataType.DOUBLE(12, 2), allowNull: false })
  sub_total: number;

  @Column({ type: DataType.DOUBLE(12, 2), allowNull: false })
  total_vat: number;

  @Column({ type: DataType.DOUBLE(12, 2), allowNull: false })
  overall_discount: number;

  @Column({
    type: DataType.DOUBLE(12, 2),
    allowNull: false,
    set(tot: number) {
      const total = parseFloat(tot.toFixed(2));
      this.setDataValue("total_amount", total);
    },
  })
  total_amount: number;

  @HasMany(() => InvoiceItems, {
    foreignKey: "invoiceId",
    sourceKey: "invoice_id",
  })
  invoiceItemDetails: InvoiceItems[];
}
