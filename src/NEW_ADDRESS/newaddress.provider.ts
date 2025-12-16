import { NewAddress } from "./newaddress.entity";

export const NewAddressProviders = [
  { provide: "NewAddressRepository", useValue: NewAddress },
];
