import { JwtService } from "@nestjs/jwt";
import { TokenManagement } from "./entity";

export const TokenMnagmentProvider: any[] = [
  { provide: "TokenManagementRepository", useValue: TokenManagement },
  {
    provide: "createRefreshToken2",
    useFactory:
      (jwtService: JwtService) => async (TokenManagement: TokenManagement) => {
        try {
          const token = jwtService.sign(
            {
              fid: TokenManagement.fid,
              otp: TokenManagement.otp,
            },
            {
              expiresIn: process.env.REFRESH_EXPIRY,
            }
          );
          return token;
        } catch (error) {
          return null;
        }
      },
    inject: [JwtService, "TokenManagementRepository"],
  },
];
