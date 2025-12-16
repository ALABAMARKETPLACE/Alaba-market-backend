import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  HasMany,
  BelongsTo,
} from "sequelize-typescript";
import { Category } from "../CATEGORY/category.entity";
import { Products } from "../PRODUCTS/products.entity";

@Table({ tableName: "SUB_CATEGORY" })
export class SubCategory extends Model<SubCategory> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  _id: number;

  @Column({ type: DataType.STRING, unique: "key", allowNull: false })
  name: string;

  @Column(DataType.STRING)
  description: string;

  @Column(DataType.STRING)
  image!: string;

  @Column({ type: DataType.STRING(200), allowNull: false, unique: true })
  slug: string;

  @ForeignKey(() => Category)
  @Column({ type: DataType.BIGINT, unique: "key", allowNull: false })
  category_id: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  position: number;

  @Column(DataType.STRING)
  bannerImg: string;

  @BelongsTo(() => Category, { onDelete: "RESTRICT", hooks: true })
  category: Category;

  @HasMany(() => Products, { onDelete: "RESTRICT", hooks: true })
  products: Products[];
}
