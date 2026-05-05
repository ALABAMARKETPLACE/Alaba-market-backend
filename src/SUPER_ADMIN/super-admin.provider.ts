import { BoosterPlanConfig } from "../SELLER_BOOSTER/booster-plan-config.entity";
import { User } from "../USERS/user.entity";
import { AdminAuditLog } from "./admin-audit-log.entity";

export const SuperAdminProviders = [
  { provide: "BoosterPlanConfigRepository", useValue: BoosterPlanConfig },
  { provide: "AdminAuditLogRepository", useValue: AdminAuditLog },
  { provide: "UserRepository", useValue: User },
];
