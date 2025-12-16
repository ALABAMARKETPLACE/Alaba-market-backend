import { ApiProperty } from "@nestjs/swagger";
import { Banner } from "../banner.entity";

export class BannerDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly storeId: number;

  @ApiProperty()
  readonly description: string;

  @ApiProperty()
  readonly img_mob: string;

  @ApiProperty()
  readonly img_desk: string;

  @ApiProperty()
  readonly status: boolean;

  @ApiProperty()
  readonly title: string;

  @ApiProperty()
  readonly position: number;

  constructor(banner: Banner) {
    this.id = banner.id;
    this.storeId = banner.storeId;
    this.description = banner.description;
    this.img_desk = banner.img_desk;
    this.img_mob = banner.img_mob;
    this.status = banner.status;
    this.title = banner.title;
    this.position = banner.position;
  }
}
