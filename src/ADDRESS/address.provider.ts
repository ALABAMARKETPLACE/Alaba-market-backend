import { Address } from "./address.entity";

export const AddressProviders = [
	{ provide: "AddressRepository", useValue: Address },
];
