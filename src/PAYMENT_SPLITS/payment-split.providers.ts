import { PaymentSplit } from "./payment-split.entity";
import { Order } from "../ORDER/order.entity";
import { Store } from "../STORE/store.entity";

export const paymentSplitProviders = [
  {
    provide: "PaymentSplitRepository",
    useValue: PaymentSplit,
  },
  {
    provide: "OrderRepository",
    useValue: Order,
  },
  {
    provide: "StoreRepository",
    useValue: Store,
  },
];