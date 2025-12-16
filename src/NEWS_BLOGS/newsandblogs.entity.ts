import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";

@Table({ tableName: "NEWS_BLOGS" })
export class NewsAndBlogs extends Model<NewsAndBlogs> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Column({ type: DataType.STRING })
  title: string;

  @Column({ type: DataType.STRING })
  image: string;

  @Column({ type: DataType.STRING })
  categories: string;

  @Column({ type: DataType.STRING })
  tags: string;

  @Column({ type: DataType.DATE })
  date: Date;

  @Column({ type: DataType.STRING })
  description: string;

  @Column({ type: DataType.STRING })
  content: string;
}
