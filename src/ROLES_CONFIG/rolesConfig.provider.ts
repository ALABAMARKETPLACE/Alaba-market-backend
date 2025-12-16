import { RolesConfig } from "./rolesConfig.entity";
export const RolesConfigProviders = [
  { provide: "RolesRepository", useValue: RolesConfig },
];
