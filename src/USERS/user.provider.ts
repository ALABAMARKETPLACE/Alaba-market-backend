import { User } from "./user.entity";
import { Role } from "../shared/enum/role.enum";
import { JwtService } from "@nestjs/jwt";

export const UserProviders: any[] = [
  { provide: "UserRepository", useValue: User },
  {
    provide: "CreateToken",
    useFactory: (jwtservice: JwtService) => async (user: User, fid: number) => {
      try {
        const token = jwtservice.sign(
          {
            data: {
              id: user._id,
              role: user.role,
              storeId: user.store_id,
              fid,
            },
          },
          {
            expiresIn:
              user?.role == Role.Admin
                ? process.env.SESSION_EXPIRY_ADMIN
                : user?.role == Role.Seller
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
        purpose?: "email_verification" | "password_reset" | "account_deactivation",
      ) => {
      try {
        const token = jwtService.sign(
          { data: { userId, ...(purpose ? { purpose } : {}) } },
          {
            expiresIn: process.env.VERIFY_EXPIRY,
          }
        );
        return token;
      } catch (error) {
        return null;
      }
    },
    inject: [JwtService, "UserRepository"],
  },
];
