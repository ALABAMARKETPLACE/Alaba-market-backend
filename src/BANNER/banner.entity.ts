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
import { Store } from "../STORE/store.entity";

@Table({ tableName: "BANNER" })
export class Banner extends Model<Banner> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => Store)
  @Column({ type: DataType.INTEGER, allowNull: false })
  storeId: number;

  @Column({ type: DataType.STRING })
  title: string;

  @Column({ type: DataType.STRING })
  description: string;

  @Column(DataType.STRING)
  img_mob: string;

  @Column({ type: DataType.STRING, allowNull: false })
  img_desk: string;

  @Column(DataType.BOOLEAN)
  status: boolean;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  position: number;

  @BelongsTo(() => Store)
  storeDetails: Store;
}
