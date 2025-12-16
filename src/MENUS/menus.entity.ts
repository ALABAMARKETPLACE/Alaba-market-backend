import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
} from "sequelize-typescript";

@Table({ tableName: "MENUS" })
export class Menus extends Model<Menus> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  route: string;

  @Column(DataType.STRING)
  icon: string;
}
