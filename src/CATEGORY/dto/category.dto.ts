import { Category } from "./../category.entity";
import { ApiProperty } from "@nestjs/swagger";

export class CategoryDto {
  id: number;
  readonly name: string;
  readonly image: string;
  readonly description: string;
  readonly featured: boolean;
  readonly featureTitle: string;
  readonly position: number;
  readonly createdAt: any;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
    this.image = category.image;
    this.description = category.description;
    this.featured = category.featured;
    this.featureTitle = category.featuredTitle;
    this.position = category.position;
    this.createdAt = category.createdAt;
  }
}
