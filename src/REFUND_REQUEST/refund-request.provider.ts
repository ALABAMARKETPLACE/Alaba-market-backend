import { RefundRequest } from "./refund-request.entity";

export const RefundRequestProvider = [
  { provide: "RefundRequestRepository", useValue: RefundRequest },
];
