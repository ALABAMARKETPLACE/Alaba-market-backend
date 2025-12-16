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
import { Offers } from "../OFFERS/offers.entity";
  
  @Table({ tableName: "OFFER_PRODUCTS" })
  export class OfferProducts extends Model<OfferProducts> {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;
  
    @ForeignKey(() => Offers)
    @Column({ type: DataType.INTEGER, allowNull: false, unique: "key" })
    offerId: number;
  
    @ForeignKey(() => Products)
    @Column({ type: DataType.BIGINT, allowNull: false, unique: "key" })
    productId: number;
  
    @BelongsTo(() => Offers)
    offer: Offers;
  
    @BelongsTo(() => Products)
    product: Products;
  }
  