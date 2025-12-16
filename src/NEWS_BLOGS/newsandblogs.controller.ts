import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { NewsAndBlogsService } from "./newsandblogs.service";
import { NewsAndBlogsDto } from "./dto/newsandblogs.dto";
import { CreateNewsAndBlogsDto } from "./dto/createNewsAndBlogs.dto";
import { UpdateNewsAndBlogsDto } from "./dto/updateNewsAndBlogs.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { ApiPaginatedResponse } from "../shared/decorator/dto-paginated.decorator";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";

@Controller("newsandblogs")
@ApiTags("newsandblogs")
export class NewsAndBlogsController {
  constructor(private readonly newsandblogsService: NewsAndBlogsService) {}

}
