import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interface';

export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
