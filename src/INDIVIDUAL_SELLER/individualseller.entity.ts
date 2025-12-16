import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";

@Table({ tableName: "INDIVIDUAL_SELLER" })
export class IndividualSeller extends Model<IndividualSeller> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  email: string;

  @Column(DataType.STRING)
  phone: string;

  @Column(DataType.STRING)
  code: string;

  @Column(DataType.STRING)
  business_location: string;

  @Column(DataType.STRING)
  education: string;

  @Column(DataType.STRING)
  visa_status: string;

  @Column(DataType.INTEGER)
  age: number;

  @Column(DataType.STRING)
  gender: string;

  @Column(DataType.STRING)
  language: string;

  @Column(DataType.STRING)
  interest: string;

  @Column(DataType.STRING)
  status: string;

  @Column(DataType.STRING)
  status_remark: string;
}
