import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";

@Table({ tableName: "SETTINGS" })
export class Settings extends Model<Settings> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column(DataType.STRING)
  type: string;

  @Column(DataType.BOOLEAN)
  isLocation: boolean;

  @Column(DataType.STRING)
  currency: string;

  @Column(DataType.STRING)
  adminEmail: string;

  @Column(DataType.STRING)
  supportInfoEmail: string;

  @Column(DataType.STRING)
  contactEmail: string;

  @Column(DataType.STRING)
  contactNumber: string;

  @Column(DataType.STRING)
  address: string;

  @Column(DataType.INTEGER)
  radius: number;
}
