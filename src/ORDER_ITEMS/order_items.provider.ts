import { OrderItems } from "./order_items.entity";

export const OrderItemsProvider = [{ provide: "OrderItemsRepository", useValue: OrderItems }];
