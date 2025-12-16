import { DeliveryCharge } from "./deliverycharge.entity";

export const DeliveryChargeProvider = [
  { provide: "DeliveryChargeRepository", useValue: DeliveryCharge },
];
