import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import { Invoice } from "../INVOICE/invoice.entity";

@Table({ tableName: "INVOICE_ITEMS" })
export class InvoiceItems extends Model<InvoiceItems> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Invoice)
  @Column({ type: DataType.STRING })
  invoiceId: string;

  @Column({ type: DataType.STRING })
  product: string;

  @Column({ type: DataType.STRING })
  title: string;

  @Column({ type: DataType.INTEGER })
  quantity: number;

  @Column({ type: DataType.INTEGER })
  unitPrice: number;

  @Column({ type: DataType.INTEGER })
  delivery_charge: number;

  @Column({
    type: DataType.INTEGER,
    set(discount: number) {
      const unitPrice: number = this.getDataValue("unitPrice");
      //if discount is greater than unitprice
      if (discount > unitPrice) {
        discount = unitPrice;
      }
      this.setDataValue("discount", discount);
    },
  })
  discount: number;

  //tax in persontage for a unit
  @Column({ type: DataType.INTEGER, validate: { min: 0, max: 100 } })
  tax: number;

  @Column({
    type: DataType.DOUBLE,
    set(value: number) {
      const discount: number = this.getDataValue("discount") || 0;
      const quantity: number = this.getDataValue("quantity") || 0;
      const tax: number = this.getDataValue("tax") || 0;
      const unitPrice: number = this.getDataValue("unitPrice") || 0;
      const total =
        ((unitPrice - discount + (unitPrice / 100) * tax) * quantity * 100) /
        100;
      this.setDataValue("total", total);
    },
  })
  total: number;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      const discount: number = this.getDataValue("discount");
      const quantity: number = this.getDataValue("quantity");
      return Math.round(discount * quantity * 100) / 100 ?? 0;
    },
  })
  totalDiscount: number;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      const price: number = this.getDataValue("unitPrice");
      const quantity: number = this.getDataValue("quantity");
      return Math.round(price * quantity * 100) / 100 ?? 0;
    },
  })
  netPrice: number;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      const tax: number = this.getDataValue("tax");
      const unitPrice: number = this.getDataValue("unitPrice");
      const quantity: number = this.getDataValue("quantity");
      const total = (unitPrice / 100) * tax * quantity;
      return Math.round(total * 100) / 100 ?? 0;
    },
  })
  totalVat: number;

  @BelongsTo(() => Invoice, {
    foreignKey: "invoiceId",
    targetKey: "invoice_id",
  })
  invoiceDetails: Invoice;
}
