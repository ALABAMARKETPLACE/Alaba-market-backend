import { OrderStatus } from "./order_status.entity";

export const OrderStatusProvider = [{ provide: "OrderStatusRepository", useValue: OrderStatus }];
