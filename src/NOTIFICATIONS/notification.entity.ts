import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";

@Table({ tableName: "NOTIFICATIONS" })
export class NotificationsModal extends Model<NotificationsModal> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id: number;

  @Column({ type: DataType.STRING })
  type: string;

  @Column({ type: DataType.STRING })
  message: string;

  @Column({ type: DataType.STRING })
  title: string;

  @Column({
    type: DataType.BIGINT,
  })
  typeId: number;

  @Column({
    type: DataType.STRING,
    defaultValue: process.env.LOGO,
  })
  image: string;

  @Column({
    type: DataType.BIGINT,
  })
  userId: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_read: boolean;
}
