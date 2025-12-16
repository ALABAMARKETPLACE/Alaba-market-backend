import { StoreReview } from "./storereview.entity";

export const StoreReviewProvider = [
  { provide: "StoreReviewRepository", useValue: StoreReview },
];
