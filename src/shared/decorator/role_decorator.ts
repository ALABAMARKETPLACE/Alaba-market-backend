import { createParamDecorator, ExecutionContext } from "@nestjs/common";
//to get storeId from the request object
export const RRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.role ?? undefined;
  }
);
