import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateNewsAndBlogsDto {
@ApiProperty()
@IsOptional()
readonly title: string;

@ApiProperty()
@IsOptional()
readonly image: string;

@ApiProperty()
@IsOptional()
readonly categories: string;

@ApiProperty()
@IsOptional()
readonly tags: string;

@ApiProperty()
@IsOptional()
readonly date: Date;

@ApiProperty()
@IsOptional()
readonly description: string;

@ApiProperty()
@IsOptional()
readonly content: string;

}