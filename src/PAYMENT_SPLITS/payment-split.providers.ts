import { PaymentSplit } from "./payment-split.entity";
import { Order } from "../ORDER/order.entity";

export const paymentSplitProviders = [
  {
    provide: "PaymentSplitRepository",
    useValue: PaymentSplit,
  },
  {
    provide: "OrderRepository",
    useValue: Order,
  },
];