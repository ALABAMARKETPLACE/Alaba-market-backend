import { Offers } from "./offers.entity";
export const OffersProvider = [
  { provide: "OffersRepository", useValue: Offers },
];
