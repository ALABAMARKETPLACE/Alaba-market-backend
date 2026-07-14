import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  Index,
  IsUrl,
  AfterFind,
} from "sequelize-typescript";
import { SubCategory } from "../SUB_CATEGORY/sub_category.entity";
import { Category } from "../CATEGORY/category.entity";
import { CartTable } from "../CART/cart.entity";
import { ProductImage } from "../PRODUCT_IMAGE/productimage.entity";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { Store } from "../STORE/store.entity";
import { DataTypes } from "sequelize";
import { UUID } from "crypto";
import { ProductReviews } from "../PRODUCT_REVIEWS/prod_rev.entity";
import { Wishlist } from "../WISHLIST/wishlist.entity";
import { UserHistory } from "../USER_HISTORY/userhistory.entity";

@Table({ tableName: "PRODUCTS" })
export class Products extends Model<Products> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
    get() {
      const rawValue = this.getDataValue("_id");
      return rawValue !== null ? Number(rawValue) : null;
    },
  })
  _id: number;

  @AfterFind
  static addIdAlias(instances: Products | Products[]): void {
    const list = Array.isArray(instances) ? instances : instances ? [instances] : [];
    for (const instance of list) {
      const raw = instance.getDataValue("_id");
      instance.setDataValue("id", raw !== null ? Number(raw) : null);
    }
  }

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 240],
        msg: "@@Please Enter a Valid name for the product.",
      },
    },
  })
  name: string;

  @IsUrl
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue:
      "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/no-image-icon-23485.png",
  })
  image: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: "key",
    validate: {
      len: {
        args: [10, 16],
        msg: "@@The Barcode you've entered is Incorrect. please choose a value between 10 and 16 characters",
      },
    },
  })
  bar_code: string;

  @Column({
    type: DataType.STRING(20),
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
    type: DataType.STRING(100),
    validate: {
      len: {
        args: [0, 230],
        msg: "@@The Barand name Length is too much..",
      },
    },
  })
  brand: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    set(value: string | boolean) {
      if (typeof value == "boolean") {
        this.setDataValue("bulk_order", value);
      } else if (value == "accept") {
        this.setDataValue("bulk_order", true);
      } else {
        this.setDataValue("bulk_order", false);
      }
    },
  })
  bulk_order: boolean;

  @Index
  @ForeignKey(() => Category)
  @Column({ type: DataType.INTEGER, allowNull: false })
  category: number;

  @Column({
    type: DataType.STRING,
    validate: {
      len: {
        args: [0, 250],
        msg: "@@The Product Description you entered is too long.",
      },
    },
  })
  description: string;

  @Column(DataType.TEXT)
  specifications: string;

  @Column({
    type: DataType.STRING(50),
    validate: {
      len: {
        args: [0, 250],
        msg: "@@The Manufacture name you entered is too long.",
      },
    },
  })
  manufacture: string;

  @Column({
    type: DataType.DOUBLE,
    allowNull: true,
  })
  purchase_rate: number;

  @Column({
    type: DataType.DOUBLE,
    validate: {
      customValidator(value: number) {
        if (value < 0) {
          throw new Error("The Retail Rate should be a positive value@@");
        }
      },
    },
  })
  retail_rate: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    set(value: string | boolean) {
      if (typeof value == "boolean") {
        this.setDataValue("status", value);
      } else if (value == "available") {
        this.setDataValue("status", true);
      } else {
        this.setDataValue("status", false);
      }
    },
  })
  status: boolean;

  @Index
  @ForeignKey(() => SubCategory)
  @Column({ type: DataType.INTEGER, allowNull: false })
  subCategory: number;

  @Column({
    type: DataType.STRING,
  })
  title: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      max: 100000,
      min: 0,
    },
  })
  unit: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      max: 1000000,
      min: 0,
    },
  })
  units: number;

  @Index
  @Column({ type: DataType.INTEGER, allowNull: false, unique: "key" })
  store_id: number;

  @Column({
    type: DataType.DOUBLE,
  })
  price: number;

  @Column({
    type: DataType.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  })
  pid: UUID;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    // unique: true,
    validate: {
      len: {
        args: [1, 200],
        msg: "@@Please choose a smaller name for the product",
      },
    },
  })
  slug: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  orderCount: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  totalReviews: number;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  averageRating: number;

  @BelongsTo(() => Category)
  categoryName: Category;

  @BelongsTo(() => SubCategory)
  subCategoryName: SubCategory;

  @BelongsTo(() => Store, { foreignKey: 'store_id', constraints: false })
  storeDetails: Store;

  @HasMany(() => CartTable)
  cartDetail: CartTable[];

  @HasMany(() => ProductReviews)
  productReview: ProductReviews[];

  @HasMany(() => Wishlist)
  wishLists: Wishlist[];

  @HasMany(() => ProductImage)
  productImages: ProductImage[];

  @HasMany(() => ProductVariant)
  productVariant: ProductVariant[];

  @HasMany(() => UserHistory)
  productHistory: UserHistory[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  product_video: string;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  product_weight: number;
}
