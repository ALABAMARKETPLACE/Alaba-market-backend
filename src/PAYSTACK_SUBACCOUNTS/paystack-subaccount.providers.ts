import { PaystackSubaccount } from "./paystack-subaccount.entity";


export const paystackSubaccountProviders = [
  {
    provide: "PaystackSubaccountRepository",
    useValue: PaystackSubaccount,
  },
];