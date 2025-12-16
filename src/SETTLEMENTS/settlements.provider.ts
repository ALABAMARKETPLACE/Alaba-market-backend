import { Settlements } from "./settlements.entity";

export const SettlementsProvider = [
  { provide: "SettlementsRepository", useValue: Settlements },
];