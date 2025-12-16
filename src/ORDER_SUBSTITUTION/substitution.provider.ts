import { SubstituteProducts } from "./substitute.products.entity";
import { OrderSubstitution } from "./substitution.entity";

export const SubstitutionProviders = [
  {
    provide: "substitutionRepository",
    useValue: OrderSubstitution,
  },
  {
    provide: "substitutionProductsRepo",
    useValue: SubstituteProducts,
  },
];
