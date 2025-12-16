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

  @ApiProperty()
  readonly role_id: number;

  @ApiProperty()
  readonly store_id: number;

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
    this.role_id = user.role_id;
    this.store_id = user.store_id;
  }
}
