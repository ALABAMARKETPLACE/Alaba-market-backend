import { NewsAndBlogs } from "./newsandblogs.entity";

export const NewsAndBlogsProvider = [
  { provide: "NewsAndBlogsRepository", useValue: NewsAndBlogs },
];
