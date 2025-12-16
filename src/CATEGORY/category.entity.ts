import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
} from "sequelize-typescript";
import { SubCategory } from "../SUB_CATEGORY/sub_category.entity";
import { Products } from "../PRODUCTS/products.entity";

@Table({ tableName: "CATEGORY" })
export class Category extends Model<Category> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  name: string;

  @Column(DataType.STRING)
  image: string;

  @Column(DataType.STRING)
  description: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  featured: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  featuredTitle: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  position: number;

  @HasMany(() => SubCategory, { onDelete: "RESTRICT", hooks: true })
  sub_categories: SubCategory[];

  @HasMany(() => Products, { onDelete: "RESTRICT", hooks: true })
  products: Products[];
}
