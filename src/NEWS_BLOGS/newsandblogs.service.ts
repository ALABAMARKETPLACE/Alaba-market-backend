import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { NewsAndBlogs } from "./newsandblogs.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateNewsAndBlogsDto } from "./dto/createNewsAndBlogs.dto";
import { UpdateNewsAndBlogsDto } from "./dto/updateNewsAndBlogs.dto";
import { NewsAndBlogsDto } from "./dto/newsandblogs.dto";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";

@Injectable()
export class NewsAndBlogsService {
  constructor(
    @Inject("NewsAndBlogsRepository")
    private readonly NewsAndBlogsRepository: typeof NewsAndBlogs
  ) {}

}
