import { Order } from "../ORDER/order.entity";
import { Products } from "../PRODUCTS/products.entity";
import { Store } from "../STORE/store.entity";
import { User } from "../USERS/user.entity";

export const dashboardProvider = [
  { provide: "userRepository", useValue: User },
  { provide: "storeRepository", useValue: Store },
  { provide: "productsRepository", useValue: Products },
  { provide: "orderRepository", useValue: Order },
];
