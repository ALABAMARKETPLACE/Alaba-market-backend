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

      // ✅ Upload image and store full S3 URL ONLY
      if (files?.image) {
        const imageUrl = await this.imageUploadService.uploadToS3(files.image);
        newsData.image = imageUrl;
        // ✅ NO imageKey assignment here!
      }

      // ✅ Upload video and store full S3 URL ONLY
      if (files?.video) {
        const videoUrl = await this.imageUploadService.uploadToS3(files.video);
        newsData.video = videoUrl;
        // ✅ NO videoKey assignment here!
      }

      // ✅ Upload thumbnail and store full S3 URL ONLY
      if (files?.thumbnail) {
        const thumbnailUrl = await this.imageUploadService.uploadToS3(
          files.thumbnail,
        );
        newsData.thumbnail = thumbnailUrl;
        // ✅ NO thumbnailKey assignment here!
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
        // Delete old image from S3 (extract key from URL)
        if (existing.image) {
          const oldKey = this.extractS3Key(existing.image);
          if (oldKey) {
            await this.imageUploadService.deleteFromS3(oldKey);
          }
        }

        // Upload new image
        const imageUrl = await this.imageUploadService.uploadToS3(files.image);
        updateData.image = imageUrl;
        // ✅ NO imageKey assignment here!
      }

      // ✅ Handle video update
      if (files?.video) {
        if (existing.video) {
          const oldKey = this.extractS3Key(existing.video);
          if (oldKey) {
            await this.imageUploadService.deleteFromS3(oldKey);
          }
        }

        const videoUrl = await this.imageUploadService.uploadToS3(files.video);
        updateData.video = videoUrl;
        // ✅ NO videoKey assignment here!
      }

      // ✅ Handle thumbnail update
      if (files?.thumbnail) {
        if (existing.thumbnail) {
          const oldKey = this.extractS3Key(existing.thumbnail);
          if (oldKey) {
            await this.imageUploadService.deleteFromS3(oldKey);
          }
        }

        const thumbnailUrl = await this.imageUploadService.uploadToS3(
          files.thumbnail,
        );
        updateData.thumbnail = thumbnailUrl;
        // ✅ NO thumbnailKey assignment here!
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

      // ✅ Delete files from S3 (extract keys from URLs)
      if (news.image) {
        const imageKey = this.extractS3Key(news.image);
        if (imageKey) {
          await this.imageUploadService.deleteFromS3(imageKey);
        }
      }

      if (news.video) {
        const videoKey = this.extractS3Key(news.video);
        if (videoKey) {
          await this.imageUploadService.deleteFromS3(videoKey);
        }
      }

      if (news.thumbnail) {
        const thumbnailKey = this.extractS3Key(news.thumbnail);
        if (thumbnailKey) {
          await this.imageUploadService.deleteFromS3(thumbnailKey);
        }
      }

      await this.newsRepo.delete(id);

      return new DataResponseDto({}, true, "News article deleted successfully");
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.error("Failed to delete news:", err);
      throw new InternalServerErrorException("Failed to delete news");
    }
  }

  /**
   * Extract S3 key from full S3 URL
   * Example: https://bairuha-bucket.s3.ap-south-1.amazonaws.com/alabamarketplace/1771859161043_newlogo.jpeg
   * Returns: alabamarketplace/1771859161043_newlogo.jpeg
   */
  private extractS3Key(url: string): string | null {
    if (!url) return null;

    try {
      // Match pattern: https://bucket.s3.region.amazonaws.com/KEY
      const match = url.match(/amazonaws\.com\/(.+)$/);
      return match ? match[1] : null;
    } catch (err) {
      console.error("Failed to extract S3 key from URL:", url, err);
      return null;
    }
  }
}
