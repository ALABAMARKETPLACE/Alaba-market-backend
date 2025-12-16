import { PrintStatus } from "./print_status.entity";

export const PrintStatusProvider = [{ provide: "OrderStatusRepository", useValue: PrintStatus }];
