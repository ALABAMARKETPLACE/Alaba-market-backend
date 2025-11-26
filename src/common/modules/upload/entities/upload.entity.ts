import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'uploads',
  timestamps: true,
})
export class Upload extends Model<Upload> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  userId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  fileName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  originalName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  mimeType: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  size: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  url: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  s3Key: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  s3Bucket: string;

  @Column({
    type: DataType.ENUM('image', 'document', 'video', 'audio', 'other'),
    allowNull: false,
  })
  fileType: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  entityType: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  entityId: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata: object;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isPublic: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isDeleted: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
