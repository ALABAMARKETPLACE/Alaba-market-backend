import { NewDistanceCharge } from "./newdistancecharge.entity";

export const NewDistanceChargeProviders = [
  { provide: "NewDistanceChargeRepository", useValue: NewDistanceCharge },
];
