import { ProductVariant } from "./productvariant.entity";

export const ProductVariantProvider = [
  { provide: "ProductVariantRepository", useValue: ProductVariant },
];
