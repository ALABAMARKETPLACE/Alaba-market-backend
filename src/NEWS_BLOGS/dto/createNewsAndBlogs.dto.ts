import { ApiProperty } from "@nestjs/swagger";

export class CreateNewsAndBlogsDto {
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

}