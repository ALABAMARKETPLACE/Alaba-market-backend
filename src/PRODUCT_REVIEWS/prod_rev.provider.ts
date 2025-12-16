import { ProductReviews } from "./prod_rev.entity";

export const ProductReviewsProviders = [{ provide: "ProductReviewsRepository", useValue: ProductReviews }];
