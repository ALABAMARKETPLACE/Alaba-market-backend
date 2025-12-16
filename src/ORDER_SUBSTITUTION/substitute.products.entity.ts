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
import { OrderSubstitution } from "./substitution.entity";
import { Products } from "../PRODUCTS/products.entity";

@Table({ tableName: "SUBSTITUTE_PRODUCTS" })
export class SubstituteProducts extends Model<SubstituteProducts> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => Products)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  productId: number;

  @ForeignKey(() => OrderSubstitution)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  substitutionId: number;

  @BelongsTo(() => Products, { onDelete: "cascade" })
  productDetails: Products;

  @BelongsTo(() => OrderSubstitution, { onDelete: "cascade" })
  substitutionDetails: OrderSubstitution;
}
