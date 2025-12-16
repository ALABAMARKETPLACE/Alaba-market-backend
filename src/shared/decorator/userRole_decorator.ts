import { createParamDecorator, ExecutionContext } from "@nestjs/common";
//to get user role from the request object
export const UserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.role ?? undefined;
  }
);
