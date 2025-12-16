import { ApiProperty } from "@nestjs/swagger";
import { NewsAndBlogs } from "../newsandblogs.entity";
export class NewsAndBlogsDto {
@ApiProperty()
readonly id: number;

@ApiProperty()
readonly title: string;

@ApiProperty()
readonly image: string;

@ApiProperty()
readonly categories: string;

@ApiProperty()
readonly tags: string;

@ApiProperty()
readonly date: Date;

@ApiProperty()
readonly description: string;

@ApiProperty()
readonly content: string;

constructor(newsandblogs: NewsAndBlogs) {
this.id = newsandblogs.id;
this.title = newsandblogs.title;
this.image = newsandblogs.image;
this.categories = newsandblogs.categories;
this.tags = newsandblogs.tags;
this.date = newsandblogs.date;
this.description = newsandblogs.description;
this.content = newsandblogs.content;
}
}