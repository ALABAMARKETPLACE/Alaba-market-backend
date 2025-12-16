import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { Role } from "../enum/role.enum";
import { ROLES_KEY } from "../decorator/roles.decorator";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    //getting the token from header
    const token = this.extractTokenFromHeader(request);
    const isPublic = this.reflector.get<boolean>(
      "isPublic",
      context.getHandler()
    );
    if (isPublic) {
      const data = this.jwtService.decode(token);
      request["userId"] = data?.data?.id ?? null;
      request["fid"] = data?.data?.fid ?? null;
      return true;
    }
    if (!token) {
      throw new UnauthorizedException(
        "You don't have permission to access this resource. Please log in with the correct credentials."
      );
    }
    try {
      //extracting payload from the token
      const payload = await this.jwtService.verifyAsync(token);
      request["userId"] = payload?.data?.id ?? null;
      request["storeId"] = payload?.data?.storeId ?? null;
      request["role"] = payload?.data?.role ?? null;
      request["fid"] = payload?.data?.fid ?? null;
      //checking if the key is blacklisted. if yes not allowed to access
      const blacklist = await this.cacheManager.get(String(payload?.data?.fid));
      if (blacklist) {
        throw new ForbiddenException(
          "UnAuthorized Access. You've already signed out"
        );
      }
      //getting the required roles if any
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()]
      );
      if (!requiredRoles) {
        return true;
      }
      //checking if the required role is present in the extracted payload
      const hasRequiredRole = requiredRoles.some((role) =>
        payload?.data?.role?.includes(role)
      );
      if (!hasRequiredRole) {
        throw new UnauthorizedException(
          "Failed to Authorize. You have no access to this service, Please sign in with Valid Credentials."
        );
      }
      // Only check store blacklist for sellers, not for admins
      if (payload?.data?.role?.includes(Role.Seller)) {
        const blacklistStore = await this.cacheManager.get(
          `store${payload?.data?.storeId}`
        );
        if (blacklistStore && Number(blacklistStore) == payload?.data?.storeId) {
          throw new UnauthorizedException(
            "Your Seller Privileges has been Revoked. Please contact Admin for more info"
          );
        }
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException(
        "Your session has expired. Please try logging in again."
      );
    }
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers?.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
