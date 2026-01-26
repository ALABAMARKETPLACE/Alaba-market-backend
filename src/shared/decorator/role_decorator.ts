import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const RRole = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.role;
  }
);

