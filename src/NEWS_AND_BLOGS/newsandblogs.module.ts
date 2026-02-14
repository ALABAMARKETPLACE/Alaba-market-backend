// NEWS_AND_BLOGS/newsandblogs.module.ts
import { Module } from "@nestjs/common";
import { NewsAndBlogsController } from "./newsandblogs.controller";
import { NewsAndBlogsService } from "./newsandblogs.service";
import { NewsAndBlogsRepository } from "./newsandblogs.repository";
import { NewsAndBlogs } from "./newsandblogs.entity";
import { SequelizeModule } from "@nestjs/sequelize";

@Module({
  imports: [
    SequelizeModule.forFeature([NewsAndBlogs]), // ✅ Register the model
  ],
  controllers: [NewsAndBlogsController],
  providers: [NewsAndBlogsService, NewsAndBlogsRepository],
  exports: [NewsAndBlogsService],
})
export class NewsAndBlogsModule {}
