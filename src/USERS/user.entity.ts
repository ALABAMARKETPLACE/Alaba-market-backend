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
import { Store } from "../STORE/store.entity";
import { DataTypes } from "sequelize";
import { UUID } from "crypto";
import { Role } from "../shared/enum/role.enum";

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

  @Index
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  is_active: boolean;

  @Index
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_deleted: boolean;

  @Column(DataType.DATE)
  disabled_at: Date | null;

  @Column(DataType.DATE)
  deleted_at: Date | null;

  @Column(DataType.DATE)
  admin_invited_at: Date | null;

  @Column(DataType.INTEGER)
  admin_invited_by: number | null;

  @Column(DataType.DATE)
  admin_invite_accepted_at: Date | null;

  @Column(DataType.STRING)
  role: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [Role.User],
  })
  roles: string[];

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: Role.User,
  })
  active_role: string;

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

  @BelongsTo(() => Store, { foreignKey: "store_id", constraints: false })
  store: Store;
}
