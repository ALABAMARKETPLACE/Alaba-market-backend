import { OrderLog } from "./orderlog.entity";

export const OrderLogProvider = [
  { provide: "OrderLogRepository", useValue: OrderLog },
];
