// NEWS_AND_BLOGS/newsandblogs.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { NewsAndBlogsRepository } from "./newsandblogs.repository";
import { CreateNewsDto } from "./dto/create-news.dto";
import { UpdateNewsDto } from "./dto/update-news.dto";
import { QueryNewsDto } from "./dto/query-news.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ImgcompressService } from "../IMAGE_COMPRESS/img_compress.service";

@Injectable()
export class NewsAndBlogsService {
  constructor(
    private readonly newsRepo: NewsAndBlogsRepository,
    private readonly imageUploadService: ImgcompressService,
  ) {}

  // Get paginated news
  async getPaginated(query: QueryNewsDto) {
    try {
      const result = await this.newsRepo.findPaginated(query);

      return new DataResponseDto(
        result.data,
        true,
        "News articles retrieved successfully",
      );
    } catch (err) {
      console.error("Failed to fetch news:", err);
      throw new InternalServerErrorException("Failed to fetch news");
    }
  }

  // Get single news
  async getById(id: number) {
    try {
      const news = await this.newsRepo.findById(id);

      if (!news) {
        throw new NotFoundException("News article not found");
      }

      // Increment views
      await this.newsRepo.incrementViews(id);

      return new DataResponseDto(news, true, "News article retrieved");
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException("Failed to fetch news");
    }
  }

  // Create news
  async create(
    data: CreateNewsDto,
    files?: {
      image?: Express.Multer.File;
      video?: Express.Multer.File;
      thumbnail?: Express.Multer.File;
    },
  ) {
    try {
      const newsData: any = { ...data };

      // ✅ Upload image
      if (files?.image) {
        const dirName = process.env.DIRECTORY || "news/images";
        const imageKey = `${dirName}/${Date.now()}_${files.image.originalname}`;

        const imageUrl = await this.imageUploadService.uploadToS3(files.image);
        newsData.image = imageUrl;
        newsData.imageKey = imageKey;
      }

      // ✅ Upload video
      if (files?.video) {
        const dirName = process.env.DIRECTORY || "news/videos";
        const videoKey = `${dirName}/${Date.now()}_${files.video.originalname}`;

        const videoUrl = await this.imageUploadService.uploadToS3(files.video);
        newsData.video = videoUrl;
        newsData.videoKey = videoKey;
      }

      // ✅ Upload thumbnail
      if (files?.thumbnail) {
        const dirName = process.env.DIRECTORY || "news/thumbnails";
        const thumbnailKey = `${dirName}/${Date.now()}_${
          files.thumbnail.originalname
        }`;

        const thumbnailUrl = await this.imageUploadService.uploadToS3(
          files.thumbnail,
        );
        newsData.thumbnail = thumbnailUrl;
        newsData.thumbnailKey = thumbnailKey;
      }

      const news = await this.newsRepo.create(newsData);

      return new DataResponseDto(
        news,
        true,
        "News article created successfully",
      );
    } catch (err) {
      console.error("Failed to create news:", err);
      throw new InternalServerErrorException("Failed to create news");
    }
  }

  // Update news
  async update(
    id: number,
    data: UpdateNewsDto,
    files?: {
      image?: Express.Multer.File;
      video?: Express.Multer.File;
      thumbnail?: Express.Multer.File;
    },
  ) {
    try {
      const existing = await this.newsRepo.findById(id);

      if (!existing) {
        throw new NotFoundException("News article not found");
      }

      const updateData: any = { ...data };

      // ✅ Handle image update
      if (files?.image) {
        // Delete old image from S3
        if (existing.imageKey) {
          await this.imageUploadService.deleteFromS3(existing.imageKey);
        }

        // Upload new image
        const dirName = process.env.DIRECTORY || "news/images";
        const imageKey = `${dirName}/${Date.now()}_${files.image.originalname}`;

        const imageUrl = await this.imageUploadService.uploadToS3(files.image);
        updateData.image = imageUrl;
        updateData.imageKey = imageKey;
      }

      // ✅ Handle video update
      if (files?.video) {
        if (existing.videoKey) {
          await this.imageUploadService.deleteFromS3(existing.videoKey);
        }

        const dirName = process.env.DIRECTORY || "news/videos";
        const videoKey = `${dirName}/${Date.now()}_${files.video.originalname}`;

        const videoUrl = await this.imageUploadService.uploadToS3(files.video);
        updateData.video = videoUrl;
        updateData.videoKey = videoKey;
      }

      // ✅ Handle thumbnail update
      if (files?.thumbnail) {
        if (existing.thumbnailKey) {
          await this.imageUploadService.deleteFromS3(existing.thumbnailKey);
        }

        const dirName = process.env.DIRECTORY || "news/thumbnails";
        const thumbnailKey = `${dirName}/${Date.now()}_${
          files.thumbnail.originalname
        }`;

        const thumbnailUrl = await this.imageUploadService.uploadToS3(
          files.thumbnail,
        );
        updateData.thumbnail = thumbnailUrl;
        updateData.thumbnailKey = thumbnailKey;
      }

      const updated = await this.newsRepo.update(id, updateData);

      return new DataResponseDto(
        updated,
        true,
        "News article updated successfully",
      );
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.error("Failed to update news:", err);
      throw new InternalServerErrorException("Failed to update news");
    }
  }

  // Delete news
  async delete(id: number) {
    try {
      const news = await this.newsRepo.findById(id);

      if (!news) {
        throw new NotFoundException("News article not found");
      }

      // ✅ Delete files from S3
      if (news.imageKey) {
        await this.imageUploadService.deleteFromS3(news.imageKey);
      }
      if (news.videoKey) {
        await this.imageUploadService.deleteFromS3(news.videoKey);
      }
      if (news.thumbnailKey) {
        await this.imageUploadService.deleteFromS3(news.thumbnailKey);
      }

      await this.newsRepo.delete(id);

      return new DataResponseDto({}, true, "News article deleted successfully");
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.error("Failed to delete news:", err);
      throw new InternalServerErrorException("Failed to delete news");
    }
  }
}
