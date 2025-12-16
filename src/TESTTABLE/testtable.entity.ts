import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";
import { UUID } from "crypto";
import { DataTypes } from "sequelize";
@Table({ tableName: "TEST_TABLE" })
export class TestTable extends Model<TestTable> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column({ type: DataType.STRING })
  name: string;

  @Column({ type: DataType.STRING })
  email: string;

  @Column({ type: DataType.STRING })
  phone: string;

  @Column({ type: DataType.INTEGER })
  age: number;

  @Column({ type: DataType.DATE })
  dob: Date;

  @Column({ type: DataType.UUID, defaultValue: DataTypes.UUIDV4 })
  uuid: UUID;
}
