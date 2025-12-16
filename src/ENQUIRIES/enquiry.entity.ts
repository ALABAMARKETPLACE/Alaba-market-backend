import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  IsEmail,
} from "sequelize-typescript";

@Table({ tableName: "ENQUIRY" })
export class Enquiry extends Model<Enquiry> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @IsEmail
  @Column(DataType.STRING)
  email: string;

  @Column(DataType.STRING)
  message: string;
}
