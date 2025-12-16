import { WeightCharge } from "./weightcharge.entity";

export const WeightChargeProvider = [
  { provide: "WeightChargeRepository", useValue: WeightCharge },
];
