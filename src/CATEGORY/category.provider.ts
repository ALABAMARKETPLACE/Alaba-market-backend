import { Category } from "./category.entity";

export const CategoryProviders = [{ provide: "CategoryRepository", useValue: Category }];
