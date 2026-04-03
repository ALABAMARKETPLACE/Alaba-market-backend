import {
  Table,
  Column,
  Model,
  Unique,
  IsEmail,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Index,
} from "sequelize-typescript";
import { Roles } from "../ROLES/roles.entity";
import { Store } from "../STORE/store.entity";
import { DataTypes } from "sequelize";
import { UUID } from "crypto";

@Table({
  tableName: "USER",
})
export class User extends Model<User> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  _id: number;

  @Unique
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  username: string;

  @Column
  password: string;

  @Column
  first_name: string;

  @Column
  last_name: string;

  @Column
  name!: string;

  @Index
  @Unique
  @IsEmail
  @Column
  email!: string;

  @Column
  countrycode!: string;

  @Index
  @Unique
  @Column
  phone!: string;

  @Column
  image!: string;

  @Column
  type!: string;

  @Column
  mail_verify: boolean;

  @Column
  phone_verify: boolean;

  @Column
  status: boolean;

  @Column(DataType.STRING)
  role: string;

  @Column({
    type: DataType.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  })
  uid: UUID;

  @Column(DataType.BIGINT)
  role_id: number;

  @Column(DataType.BIGINT)
  store_id: number;

  @Column({ type: DataType.STRING, allowNull: true })
  fcmtoken: string;

  @BelongsTo(() => Store, { foreignKey: 'store_id', constraints: false })
  store: Store;
}
