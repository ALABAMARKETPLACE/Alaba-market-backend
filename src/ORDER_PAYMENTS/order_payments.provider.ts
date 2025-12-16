import { OrderPayments } from "./order_payments.entity";

export const OrderPaymentsProvider = [
  { provide: "OrderPaymentsRepository", useValue: OrderPayments },
];
