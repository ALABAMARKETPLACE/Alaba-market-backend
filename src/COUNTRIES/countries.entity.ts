import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";

@Table({
  tableName: "COUNTRIES",
  paranoid: true,
  timestamps: true,
})
export class Countries extends Model<Countries> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
  })
  id: number;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: "Country name is required" },
      len: {
        args: [1, 200],
        msg: "Country name must be between 1 and 200 characters",
      },
    },
  })
  country_name: string;

  @Column({
    type: DataType.STRING(300),
    allowNull: true,
  })
  description: string;
}
