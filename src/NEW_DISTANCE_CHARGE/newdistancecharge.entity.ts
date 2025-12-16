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

@Table({
  tableName: "NEW_DISTANCE_CHARGE",
  paranoid: true,
  timestamps: true,
})
export class NewDistanceCharge extends Model<NewDistanceCharge> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
  })
  id: number;

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

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: "Minimum weight must be greater than or equal to 0",
      },
    },
  })
  min_weight: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: "Maximum weight must be greater than or equal to 0",
      },
      isGreaterThanMin(value: number) {
        if (value <= this.min_weight) {
          throw new Error("Maximum weight must be greater than minimum weight");
        }
      },
    },
  })
  max_weight: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: "Delivery charge must be greater than or equal to 0",
      },
    },
  })
  delivery_charge: number;

  @BelongsTo(() => Countries)
  countryDetails: Countries;

  @BelongsTo(() => States)
  stateDetails: States;
}
