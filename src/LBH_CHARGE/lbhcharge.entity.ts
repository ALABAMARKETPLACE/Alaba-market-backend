import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from "sequelize-typescript";

@Table({ tableName: "LBH_CHARGE" })
export class LbhCharge extends Model<LbhCharge> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;
  
  @Column(DataType.STRING)
  length: string;
  
  @Column(DataType.STRING)
  breadth: string;
  
  @Column(DataType.STRING)
  height: string;

  @Column(DataType.STRING)
  operator: string;

  @Column(DataType.STRING)
  charge: string;
}
