import { Invoice } from "./invoice.entity";


export const InvoiceProvider = [
  {
    provide: "InvoiceRepository",
    useValue: Invoice,
  },
];
