import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
  ForeignKey,
} from "sequelize-typescript";
import { RolesConfig } from "../ROLES_CONFIG/rolesConfig.entity";
import { Store } from "../STORE/store.entity";
import { User } from "../USERS/user.entity";

@Table({ tableName: "ROLES" })
export class Roles extends Model<Roles> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Store)
  @Column(DataType.BIGINT)
  store_id: number;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.BOOLEAN)
  isEditable: boolean;

  @HasMany(() => RolesConfig)
  rolesConfig: RolesConfig[];

  @HasMany(() => RolesConfig)
  Users: User[];
}
