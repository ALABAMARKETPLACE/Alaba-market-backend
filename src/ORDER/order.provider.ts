import { Order } from "./order.entity";

export const OrderProvider = [{ provide: "OrderRepository", useValue: Order }];
