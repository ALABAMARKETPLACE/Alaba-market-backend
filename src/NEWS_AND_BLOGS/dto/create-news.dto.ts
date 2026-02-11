import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsIn,
} from "class-validator";

const CATEGORIES = ["News", "Updates", "Events", "Blog", "Press Release"];

export class CreateNewsDto {
  @ApiProperty({ minLength: 5, maxLength: 255 })
  @IsNotEmpty({ message: "Title is required" })
  @IsString()
  @MinLength(5, { message: "Title must be at least 5 characters" })
  @MaxLength(255, { message: "Title cannot exceed 255 characters" })
  title: string;

  @ApiProperty({ minLength: 10, maxLength: 500 })
  @IsNotEmpty({ message: "Description is required" })
  @IsString()
  @MinLength(10, { message: "Description must be at least 10 characters" })
  @MaxLength(500, { message: "Description cannot exceed 500 characters" })
  description: string;

  @ApiPropertyOptional({ maxLength: 50000 })
  @IsOptional()
  @IsString()
  @MaxLength(50000, { message: "Content cannot exceed 50,000 characters" })
  content?: string;

  @ApiPropertyOptional({
    enum: CATEGORIES,
    default: "News",
  })
  @IsOptional()
  @IsString()
  @IsIn(CATEGORIES, { message: "Invalid category" })
  category?: string;

  @ApiPropertyOptional({ default: "Admin" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string;
}
