// NEWS_AND_BLOGS/newsandblogs.module.ts
import { Module } from "@nestjs/common";
import { NewsAndBlogsController } from "./newsandblogs.controller";
import { NewsAndBlogsService } from "./newsandblogs.service";
import { NewsAndBlogsRepository } from "./newsandblogs.repository";

@Module({
  controllers: [NewsAndBlogsController],
  providers: [NewsAndBlogsService, NewsAndBlogsRepository],
  exports: [NewsAndBlogsService],
})
export class NewsAndBlogsModule {}
