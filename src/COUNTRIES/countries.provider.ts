import { Countries } from "./countries.entity";

export const CountriesProviders = [
  { provide: "CountriesRepository", useValue: Countries },
];
