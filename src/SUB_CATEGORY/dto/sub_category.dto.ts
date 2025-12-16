import { SubCategory } from "./../sub_category.entity";
import { ApiProperty } from "@nestjs/swagger";

export class SubCategoryDto {
  @ApiProperty()
  _id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly description: string;

  @ApiProperty()
  readonly image: string;

  @ApiProperty()
  readonly category_id: number;

  @ApiProperty()
  readonly position: number;

  constructor(sub_cat: SubCategory) {
    this._id = sub_cat._id;
    this.name = sub_cat.name;
    this.image = sub_cat.image;
    this.category_id = sub_cat.category_id;
    this.description = sub_cat.description;
    this.position = sub_cat.position;
  }
}
