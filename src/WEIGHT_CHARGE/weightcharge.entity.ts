import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from "sequelize-typescript";

@Table({ tableName: "WEIGHT_CHARGE" })
export class WeightCharge extends Model<WeightCharge> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;
  
  @Column(DataType.STRING)
  weight: string;

  @Column(DataType.STRING)
  operator: string;

  @Column(DataType.STRING)
  charge: string;
}
