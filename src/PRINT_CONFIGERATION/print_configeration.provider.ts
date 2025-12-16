import { PrintConfigeration } from "./print_configeration.entity";

export const PrintConfigerationProvider = [
  { provide: "PrintConfigerationRepository", useValue: PrintConfigeration },
];
