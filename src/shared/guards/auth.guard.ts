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
import { User } from "../../USERS/user.entity";
import { normalizeRoles, resolveActiveRole } from "../helpers/user-role.helper";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const isPublic = this.reflector.get<boolean>(
      "isPublic",
      context.getHandler(),
    );

    const token = this.extractTokenFromHeader(request);

    /**
     * PUBLIC ROUTES
     */
    if (isPublic) {
      if (token) {
        const decoded: any = this.jwtService.decode(token);
        const decodedRoles = normalizeRoles(
          decoded?.data?.roles,
          decoded?.data?.role,
        );
        request.user = {
          id: decoded?.data?.id ?? null,
          storeId: decoded?.data?.storeId ?? null,
          role: resolveActiveRole(
            decodedRoles,
            decoded?.data?.activeRole,
            decoded?.data?.role,
          ),
          roles: decodedRoles,
          fid: decoded?.data?.fid ?? null,
        };
      }
      return true;
    }

    /**
     * NO TOKEN
     */
    if (!token) {
      throw new UnauthorizedException(
        "You don't have permission to access this resource. Please log in.",
      );
    }

    try {
      /**
       * VERIFY TOKEN
       */
      const payload: any = await this.jwtService.verifyAsync(token);
      const dbUser = await User.findByPk(payload?.data?.id);

      if (!dbUser || dbUser.is_deleted) {
        throw new UnauthorizedException("This account is no longer available.");
      }

      const isActive = dbUser.is_active ?? dbUser.status;
      if (isActive !== true || dbUser.status !== true) {
        throw new ForbiddenException(
          "This account has been disabled. Please contact support.",
        );
      }

      const roles = normalizeRoles(dbUser.roles, dbUser.role);
      const activeRole = resolveActiveRole(
        roles,
        dbUser.active_role,
        dbUser.role,
      );

      /**
       * ATTACH USER TO REQUEST
       */
      request.user = {
        id: dbUser._id ?? payload?.data?.id ?? null,
        storeId: dbUser.store_id ?? payload?.data?.storeId ?? null,
        role: activeRole,
        roles,
        fid: payload?.data?.fid ?? null,
      };

      /**
       * SESSION BLACKLIST CHECK
       */
      const blacklist = await this.cacheManager.get(String(request.user.fid));

      if (blacklist) {
        throw new ForbiddenException(
          "Unauthorized access. You've already signed out.",
        );
      }

      /**
       * ROLE-BASED ACCESS CONTROL
       */
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles && requiredRoles.length > 0) {
        if (!request.user.role) {
          throw new ForbiddenException("Unauthorized role");
        }

        const userRoles = normalizeRoles(request.user.roles, request.user.role);
        const hasRole = requiredRoles.some(
          (role) =>
            role.toLowerCase() === request.user.role.toLowerCase() ||
            userRoles.some(
              (userRole) => userRole.toLowerCase() === role.toLowerCase(),
            ),
        );

        if (!hasRole) {
          throw new ForbiddenException(
            "Failed to Authorize. You have no access to this service.",
          );
        }
      }

      /**
       * SELLER STORE BLACKLIST (ADMINS BYPASS)
       */
      if (request.user.role.toLowerCase() === Role.Seller.toLowerCase()) {
        if (!request.user.storeId) {
          throw new ForbiddenException("Seller has no store assigned");
        }

        const blacklistStore = await this.cacheManager.get(
          `store${request.user.storeId}`,
        );

        if (blacklistStore && Number(blacklistStore) === request.user.storeId) {
          throw new ForbiddenException(
            "Your Seller privileges have been revoked. Please contact Admin.",
          );
        }
      }

      return true;
    } catch (err) {
      if (err instanceof HttpException) throw err;

      throw new UnauthorizedException(
        "Your session has expired. Please try logging in again.",
      );
    }
  }

  /**
   * EXTRACT BEARER TOKEN
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const headerToken = this.normalizeBearerToken(
      request?.headers?.authorization,
    );

    if (headerToken) {
      return headerToken;
    }

    return this.normalizeBearerToken(
      request?.headers?.["x-access-token"],
    );
  }

  private normalizeBearerToken(value: unknown): string | undefined {
    if (!value) return;

    const token = String(value).trim();
    const [type, rawToken] = token.split(/\s+/);

    if (!rawToken) {
      return token;
    }

    if ((type || "").toLowerCase() === "bearer") {
      return rawToken;
    }

    return;
  }
}
