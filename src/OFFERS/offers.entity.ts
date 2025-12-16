import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  IsUrl,
  BelongsToMany,
} from "sequelize-typescript";
import { Products } from "../PRODUCTS/products.entity";
import { OfferProducts } from "../OFFER_PRODUCTS/offer_products.entity";

@Table({ tableName: "OFFERS" })
export class Offers extends Model<Offers> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 240],
        msg: "@@Enter a valid Title for the Offer",
      },
    },
  })
  title: string;

  @IsUrl
  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 240],
        msg: "@@Invalid Image Url",
      },
    },
  })
  image: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  slug: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: false,
    validate: {
      len: {
        args: [1, 150],
        msg: "@@Tag is too long.",
      },
    },
  })
  tag: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: new Date() })
  start_date: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  end_date: Date;

  @Column({ type: DataType.STRING(50), allowNull: true })
  comment: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  status: boolean;

  @BelongsToMany(() => Products, {
    onDelete: "cascade",
    through: () => OfferProducts,
  })
  products: any[];
}
