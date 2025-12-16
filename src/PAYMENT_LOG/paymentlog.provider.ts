import { PaymentLog } from "./paymentlog.entity";

export const PaymentLogProvider = [
  { provide: "PaymentLogRepository", useValue: PaymentLog },
];
