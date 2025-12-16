import { PrintItems } from "./print_items.entity";

export const PrintItemsProvider = [
  { provide: "PrintItemsRepository", useValue: PrintItems },
];
