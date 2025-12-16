import { States } from "./states.entity";

export const StatesProvider = [
  { provide: "StatesRepository", useValue: States },
];
