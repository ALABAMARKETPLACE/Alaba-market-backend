import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUrl } from "class-validator";

export class UserUpdateProfilePicture {
  @ApiProperty()
  @IsNotEmpty({ message: "Pleae provide an image." })
  @IsUrl({}, { message: "Invalid Url for the image" })
  readonly image: string;
}
