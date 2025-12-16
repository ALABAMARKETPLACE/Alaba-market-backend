import { createParamDecorator, ExecutionContext } from "@nestjs/common";
//to get acessKey from the request object
export const AccessKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.key ?? undefined;
  }
);
