import { InvoiceItems } from "./invoiceitems.entity";

export const InvoiceItemsProvider = [
  { provide: "InvoiceItemsRepository", useValue: InvoiceItems },
];
