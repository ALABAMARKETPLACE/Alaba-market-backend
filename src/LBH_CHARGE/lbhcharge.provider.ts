import { LbhCharge } from "./lbhcharge.entity";

export const LbhChargeProvider = [
  { provide: "LbhChargeRepository", useValue: LbhCharge },
];
