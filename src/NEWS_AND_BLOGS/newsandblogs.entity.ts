import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";

@Table({
  tableName: "NEWS_AND_BLOGS",
  timestamps: true,
})
export class NewsAndBlogs extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  description: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  content: string;

  @Column({
    type: DataType.STRING(50),
    defaultValue: "News",
  })
  category: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
  })
  image: string;

  // ✅ ADD: S3 Key for image deletion
  @Column({
    type: DataType.STRING(512),
    allowNull: true,
  })
  imageKey: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
  })
  video: string;

  // ✅ ADD: S3 Key for video deletion
  @Column({
    type: DataType.STRING(512),
    allowNull: true,
  })
  videoKey: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
  })
  thumbnail: string;

  // ✅ ADD: S3 Key for thumbnail deletion
  @Column({
    type: DataType.STRING(512),
    allowNull: true,
  })
  thumbnailKey: string;

  @Column({
    type: DataType.STRING(100),
    defaultValue: "Admin",
  })
  author: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  views: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_published: boolean;

  @CreatedAt
  @Column({ field: "created_at" })
  createdAt: Date;

  @UpdatedAt
  @Column({ field: "updated_at" })
  updatedAt: Date;
}
