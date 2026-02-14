import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  ParseIntPipe,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiConsumes,
} from "@nestjs/swagger";
import { CreateNewsDto } from "./dto/create-news.dto";
import { UpdateNewsDto } from "./dto/update-news.dto";
import { QueryNewsDto } from "./dto/query-news.dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { RolesGuard } from "../shared/guards/roles.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Public } from "../shared/decorator/optional.decorator";
import { NewsAndBlogsService } from "./newsandblogs.service";

@Controller("newsandblogs")
@ApiTags("newsandblogs")
export class NewsAndBlogsController {
  constructor(private readonly newsService: NewsAndBlogsService) {}

  // PUBLIC: Get paginated
  @Public()
  @Get()
  @ApiOkResponse()
  getPaginated(@Query() query: QueryNewsDto) {
    return this.newsService.getPaginated(query);
  }

  // PUBLIC: Get single news
  @Public()
  @Get(":id")
  @ApiOkResponse({ type: DataResponseDto })
  getById(@Param("id", ParseIntPipe) id: number) {
    return this.newsService.getById(id);
  }

  // ADMIN: Create news
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin) // Only admins can create
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: DataResponseDto })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "image", maxCount: 1 },
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
  )
  create(
    @Body() createDto: CreateNewsDto,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    const fileObjects = files
      ? {
          image: files.image?.[0],
          video: files.video?.[0],
          thumbnail: files.thumbnail?.[0],
        }
      : undefined;

    return this.newsService.create(createDto, fileObjects);
  }

  // ADMIN: Update news
  @Put(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOkResponse({ type: DataResponseDto })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "image", maxCount: 1 },
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
  )
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateNewsDto,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    const fileObjects = files
      ? {
          image: files.image?.[0],
          video: files.video?.[0],
          thumbnail: files.thumbnail?.[0],
        }
      : undefined;

    return this.newsService.update(id, updateDto, fileObjects);
  }

  // ADMIN: Delete news
  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOkResponse({ type: DataResponseDto })
  @HttpCode(200)
  delete(@Param("id", ParseIntPipe) id: number) {
    return this.newsService.delete(id);
  }
}
