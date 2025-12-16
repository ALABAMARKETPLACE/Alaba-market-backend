import {
  Table,
  Model,
  PrimaryKey,
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
} from "sequelize-typescript";
import { Roles } from "../ROLES/roles.entity";
import { Store } from "../STORE/store.entity";

@Table({ tableName: "ROLES_CONFIG" })
export class RolesConfig extends Model<RolesConfig> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Store)
  @Column(DataType.BIGINT)
  store_id: number;
  
  @ForeignKey(() => Roles)
  @Column(DataType.BIGINT)
  role_id: number;

  @Column
  menus: string;
}
