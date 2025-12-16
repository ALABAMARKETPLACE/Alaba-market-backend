import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";
  
@Table({ tableName: "PAYMENT_LOG" })
export class PaymentLog extends Model<PaymentLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({type:DataType.BIGINT})
  id: number;
   
  @Column({ type: DataType.INTEGER })
  userId: number;
  
  @Column({ type: DataType.INTEGER })
  addressId: number;
  
  @Column({ type: DataType.JSON })
  cart: JSON;
  
  @Column({ type: DataType.STRING })
  ref: string;
  
  @Column({ type: DataType.JSON })
  charges: JSON;
    
}