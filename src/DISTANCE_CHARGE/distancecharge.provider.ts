import { DistanceCharge } from "./distancecharge.entity";

export const DistanceChargeProvider = [
  { provide: "DistanceChargeRepository", useValue: DistanceCharge },
];
