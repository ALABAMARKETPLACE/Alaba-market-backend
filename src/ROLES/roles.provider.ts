import { Roles } from "./roles.entity";
export const RolesProviders = [{ provide: "RolesRepository", useValue: Roles }];
