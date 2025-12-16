import { Module } from "@nestjs/common";
import { NewsAndBlogsController } from "./newsandblogs.controller";
import { NewsAndBlogsService } from "./newsandblogs.service";
import { NewsAndBlogsProvider } from "./newsandblogs.provider";

@Module({
  imports: [],
  controllers: [NewsAndBlogsController],
  providers: [NewsAndBlogsService, ...NewsAndBlogsProvider],
  exports: [NewsAndBlogsService],
})
export class NewsAndBlogsModule {}
