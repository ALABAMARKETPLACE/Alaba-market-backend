import { User } from "./../user.entity";
import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
  @ApiProperty()
  _id: number;

  @ApiProperty()
  readonly email: string;

  @ApiProperty()
  readonly username: string;

  @ApiProperty()
  readonly password: string;

  @ApiProperty()
  readonly first_name: string;

  @ApiProperty()
  readonly last_name: string;

  @ApiProperty()
  readonly phone: string;

  @ApiProperty()
  readonly image: string;

  @ApiProperty()
  readonly type: string;

  @ApiProperty()
  readonly status: boolean;

  @ApiProperty()
  readonly role: string;

  @ApiProperty({ type: [String] })
  readonly roles: string[];

  @ApiProperty()
  readonly active_role: string;

  @ApiProperty()
  readonly role_id: number;

  @ApiProperty()
  readonly store_id: number;

  @ApiProperty()
  readonly is_active: boolean;

  @ApiProperty()
  readonly is_deleted: boolean;

  @ApiProperty({ required: false, nullable: true })
  readonly disabled_at?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  readonly deleted_at?: Date | null;

  constructor(user: User) {
    this._id = user._id;
    this.email = user.email;
    this.username = user.username;
    this.password = user.password;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.phone = user.phone;
    this.image = user.image;
    this.type = user.type;
    this.status = user.status;
    this.role = user.role;
    this.roles = user.roles;
    this.active_role = user.active_role;
    this.role_id = user.role_id;
    this.store_id = user.store_id;
    this.is_active = user.is_active;
    this.is_deleted = user.is_deleted;
    this.disabled_at = user.disabled_at;
    this.deleted_at = user.deleted_at;
  }
}
