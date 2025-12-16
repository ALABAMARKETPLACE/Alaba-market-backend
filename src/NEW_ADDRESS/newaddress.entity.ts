import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Countries } from "../COUNTRIES/countries.entity";
import { States } from "../STATES/states.entity";
import { User } from "../USERS/user.entity";

@Table({
  tableName: "NEW_ADDRESS",
  paranoid: true,
  timestamps: true,
})
export class NewAddress extends Model<NewAddress> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  user_id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Address type is required" },
      len: {
        args: [1, 50],
        msg: "Address type must be between 1 and 50 characters",
      },
    },
  })
  address_type: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Full address is required" },
      len: {
        args: [1, 500],
        msg: "Full address must be between 1 and 500 characters",
      },
    },
  })
  full_address: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Pincode is required" },
      len: {
        args: [1, 20],
        msg: "Pincode must be between 1 and 20 characters",
      },
    },
  })
  pincode: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Phone number is required" },
      len: {
        args: [10, 20],
        msg: "Phone number must be between 10 and 20 characters",
      },
    },
  })
  phone_no: string;

  @ForeignKey(() => Countries)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  country_id: number;

  @ForeignKey(() => States)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  state_id: number;

  @BelongsTo(() => User)
  userDetails: User;

  @BelongsTo(() => Countries)
  countryDetails: Countries;

  @BelongsTo(() => States)
  stateDetails: States;
}
