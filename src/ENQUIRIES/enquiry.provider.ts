import { Enquiry } from "./enquiry.entity";

export const EnquiryProviders = [
  { provide: "EnquiryRepository", useValue: Enquiry },
];
