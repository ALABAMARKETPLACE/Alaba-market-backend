import { Injectable } from "@nestjs/common";
import { NewsAndBlogs } from "./newsandblogs.entity";
import { Op } from "sequelize";
import { InjectModel } from "@nestjs/sequelize";
import { QueryNewsDto } from "./dto/query-news.dto";
import { CreateNewsDto } from "./dto/create-news.dto";
import { UpdateNewsDto } from "./dto/update-news.dto";

@Injectable()
export class NewsAndBlogsRepository {
  // Get paginated news with filters
  // NEWS_AND_BLOGS/newsandblogs.repository.ts

  async findPaginated(query: QueryNewsDto) {
    // ✅ Use 'take' and 'skip' from PageOptionsDto (instead of limit/offset)
    const limit = query.take || 12;
    // const offset = query.skip || 0;

    const whereClause: any = {
      is_published: true,
    };

    // Filter by category
    if (query.category) {
      whereClause.category = query.category;
    }

    // Search in title and description
    if (query.search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    const { count, rows } = await NewsAndBlogs.findAndCountAll({
      where: whereClause,
      limit,
      // offset,
      order: [["createdAt", "DESC"]],
      attributes: {
        exclude: ["is_published"],
      },
    });

    return {
      data: rows,
      total: count,
    };
  }

  // Get single news by ID
  async findById(id: number) {
    return await NewsAndBlogs.findByPk(id, {
      attributes: {
        exclude: ["is_published"],
      },
    });
  }

  // Create news
  async create(
    data: CreateNewsDto & {
      image?: string;
      video?: string;
      thumbnail?: string;
    },
  ) {
    return await NewsAndBlogs.create({
      ...data,
      category: data.category || "News",
      author: data.author || "Admin",
    });
  }

  // Update news
  async update(
    id: number,
    data: UpdateNewsDto & {
      image?: string;
      video?: string;
      thumbnail?: string;
    },
  ) {
    const [affectedCount, [updatedNews]] = await NewsAndBlogs.update(data, {
      where: { id },
      returning: true,
    });

    return affectedCount > 0 ? updatedNews : null;
  }

  // Delete news
  async delete(id: number) {
    const deleted = await NewsAndBlogs.destroy({
      where: { id },
    });

    return deleted > 0;
  }

  // Increment views
  async incrementViews(id: number) {
    await NewsAndBlogs.increment("views", {
      where: { id },
    });
  }
}
