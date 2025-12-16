import { ProductImage } from "./productimage.entity";

export const ProductImageProvider = [
  { provide: "ProductImageRepository", useValue: ProductImage },
];
