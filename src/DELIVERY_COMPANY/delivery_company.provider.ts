import { DeliveryCompany } from "./delivery_company.entity";
import { Driver } from "./driver.entity";
import { DriverInvitation } from "./driver_invitation.entity";
import { DriverOrder } from "./driver_order.entity";

export const DeliveryCompanyProvider = [
  {
    provide: "DELIVERY_COMPANY_REPOSITORY",
    useValue: DeliveryCompany,
  },
  {
    provide: "DRIVER_REPOSITORY",
    useValue: Driver,
  },
  {
    provide: "DRIVER_INVITATION_REPOSITORY",
    useValue: DriverInvitation,
  },
  {
    provide: "DRIVER_ORDER_REPOSITORY",
    useValue: DriverOrder,
  },
];
