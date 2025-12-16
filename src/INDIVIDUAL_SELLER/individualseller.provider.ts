import { IndividualSeller } from "./individualseller.entity";

export const IndividualSellerProvider = [
  { provide: "IndividualSellerRepository", useValue: IndividualSeller },
];
