import { BusinessType } from "./businesstype.entity";

export const BusinessTypeProvider = [
  { provide: "BusinessTypeRepository", useValue: BusinessType },
];
