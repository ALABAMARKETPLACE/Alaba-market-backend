import { PartialType } from "@nestjs/swagger";
import { CreateNewsDto } from "./create-news.dto";

// All fields from CreateNewsDto become optional
export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
