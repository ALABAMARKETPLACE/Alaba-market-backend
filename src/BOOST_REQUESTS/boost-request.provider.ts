import { BoostRequest } from "./boost-request.entity";

export const BoostRequestProviders = [
  {
    provide: "BoostRequestRepository",
    useValue: BoostRequest,
  },
];
