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

@Injectable()
export class NewsAndBlogsService {
  constructor(private readonly newsRepo: NewsAndBlogsRepository) {}

  // Get paginated news
  // NEWS_AND_BLOGS/newsandblogs.service.ts

  // ✅ FIXED: Get paginated news
  async getPaginated(query: QueryNewsDto) {
    try {
      const result = await this.newsRepo.findPaginated(query);

      return new DataResponseDto(
        result.data,
        true,
        "News articles retrieved successfully",
        query, // ✅ Now it matches PageOptionsDto!
        result.total,
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
  //   async getall() {
  //     try {
  //       const news = await this.newsRepo.all();

  //       if (!news) {
  //         throw new NotFoundException("News article not found");
  //       }

  //       // Increment views
  //       await this.newsRepo.incrementViews(id);

  //       return new DataResponseDto(news, true, "News article retrieved");
  //     } catch (err) {
  //       if (err instanceof NotFoundException) throw err;
  //       throw new InternalServerErrorException("Failed to fetch news");
  //     }
  //   }

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

      // Handle file uploads (you'll implement this next)
      if (files?.image) {
        newsData.image = await this.uploadFile(files.image, "images");
      }
      if (files?.video) {
        newsData.video = await this.uploadFile(files.video, "videos");
      }
      if (files?.thumbnail) {
        newsData.thumbnail = await this.uploadFile(
          files.thumbnail,
          "thumbnails",
        );
      }

      const news = await this.newsRepo.create(newsData);

      return new DataResponseDto(
        news,
        true,
        "News article created successfully",
      );
    } catch (err) {
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

      // Handle file uploads
      if (files?.image) {
        // Delete old image if exists
        if (existing.image) {
          await this.deleteFile(existing.image);
        }
        updateData.image = await this.uploadFile(files.image, "images");
      }
      if (files?.video) {
        if (existing.video) {
          await this.deleteFile(existing.video);
        }
        updateData.video = await this.uploadFile(files.video, "videos");
      }
      if (files?.thumbnail) {
        if (existing.thumbnail) {
          await this.deleteFile(existing.thumbnail);
        }
        updateData.thumbnail = await this.uploadFile(
          files.thumbnail,
          "thumbnails",
        );
      }

      const updated = await this.newsRepo.update(id, updateData);

      return new DataResponseDto(
        updated,
        true,
        "News article updated successfully",
      );
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
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

      // Delete associated files
      if (news.image) await this.deleteFile(news.image);
      if (news.video) await this.deleteFile(news.video);
      if (news.thumbnail) await this.deleteFile(news.thumbnail);

      await this.newsRepo.delete(id);

      return new DataResponseDto({}, true, "News article deleted successfully");
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException("Failed to delete news");
    }
  }

  // Helper: Upload file (implement based on your storage solution)
  private async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    // TODO: Implement file upload to S3/Google Cloud/local storage
    // For now, return placeholder
    const timestamp = Date.now();
    const filename = `${folder}/${timestamp}_${file.originalname}`;

    // Your upload logic here
    // return uploadedUrl;

    return `https://storage.example.com/news/${filename}`;
  }

  // Helper: Delete file
  private async deleteFile(url: string): Promise<void> {
    // TODO: Implement file deletion
    console.log("Deleting file:", url);
  }
}
