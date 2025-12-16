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
import { Products } from "../PRODUCTS/products.entity";
import { IsInt } from "class-validator";

@Table({ tableName: "PRODUCT_VARIANT" })
export class ProductVariant extends Model<ProductVariant> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @ForeignKey(() => Products)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId: number;

  @Column(DataType.INTEGER)
  available: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: {
        args: [10, 16],
        msg: "@@The Barcode you've entered is Incorrect. please choose a value between 10 and 16 characters",
      },
    },
  })
  barcode: string;

  @Column({
    type: DataType.STRING,
    validate: {
      len: {
        args: [5, 100],
        msg: "Please add an image for the Variant@@",
      },
    },
  })
  image: string;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
    validate: {
      customValidator(value: number) {
        if (value < 0) {
          throw new Error("The price should be a positive value@@");
        }
      },
    },
  })
  price: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: {
        args: [10, 16],
        msg: "@@The SKU you've entered is Incorrect. please choose a value between 10 and 16 characters",
      },
    },
  })
  sku: string;

  @Column({
    type: DataType.INTEGER,
    validate: {
      isInt: {
        msg: "Please use a Valid Number for Units@@",
      },
      customValidator(value: number) {
        if (value > 100000) {
          throw new Error("Maximum Allowed units are 100000@@");
        }
        if (value < 0) {
          throw new Error("Units should be greater than 0@@");
        }
      },
    },
  })
  units: number;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Combination for the product cannot be empty.@@",
      },
    },
  })
  combination: JSON;

  @BelongsTo(() => Products)
  product: Products;
}
