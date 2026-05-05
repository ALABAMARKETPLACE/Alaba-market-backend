import { User } from "./user.entity";
import { Role } from "../shared/enum/role.enum";
import { JwtService } from "@nestjs/jwt";
import {
  normalizeRoles,
  resolveActiveRole,
} from "../shared/helpers/user-role.helper";

export const UserProviders: any[] = [
  { provide: "UserRepository", useValue: User },
  {
    provide: "CreateToken",
    useFactory: (jwtservice: JwtService) => async (user: User, fid: number) => {
      try {
        const roles = normalizeRoles(user.roles, user.role);
        const activeRole = resolveActiveRole(roles, user.active_role, user.role);
        const token = jwtservice.sign(
          {
            data: {
              id: user._id,
              role: activeRole,
              roles,
              activeRole,
              storeId: user.store_id,
              fid,
            },
          },
          {
            expiresIn:
              activeRole == Role.Admin || activeRole == Role.SuperAdmin
                ? process.env.SESSION_EXPIRY_ADMIN
                : activeRole == Role.Seller
                ? process.env.SESSION_EXPIRY_SELLER
                : process.env.SESSION_EXPIRY,
          }
        );
        return token;
      } catch (error) {
        return null;
      }
    },
    inject: [JwtService, "UserRepository"],
  },
  {
    provide: "CreateVerifyToken",
    useFactory:
      (jwtService: JwtService) =>
      async (
        userId: number,
        purpose?:
          | "email_verification"
          | "password_reset"
          | "account_deactivation"
          | "admin_invitation",
      ) => {
        try {
          const token = jwtService.sign(
            { data: { userId, ...(purpose ? { purpose } : {}) } },
            {
              expiresIn: process.env.VERIFY_EXPIRY,
            },
          );
          return token;
        } catch (error) {
          return null;
        }
      },
    inject: [JwtService, "UserRepository"],
  },
];
