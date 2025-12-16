import { createParamDecorator, ExecutionContext } from "@nestjs/common";
//to get userId from the request object
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.userId ?? undefined;
  }
);
