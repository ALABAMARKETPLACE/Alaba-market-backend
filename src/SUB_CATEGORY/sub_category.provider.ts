import { SubCategory } from "./sub_category.entity";

export const SubCategoryProviders = [{ provide: "SubCategoryRepository", useValue: SubCategory }];
