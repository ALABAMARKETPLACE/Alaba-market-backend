import { Products } from "./products.entity";

export const ProductsProviders = [{ provide: "ProductsRepository", useValue: Products }];
