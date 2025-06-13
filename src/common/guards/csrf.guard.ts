import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { Request } from 'express';
  import { CSRF_SKIP_KEY } from '../decorators';
  import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
  
  @Injectable()
  export class CsrfGuard implements CanActivate {
    constructor(private reflector: Reflector, private configService: ConfigService) {}
  
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<Request>();
  
      if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        return true;
      }

      const handler = context.getHandler();
      const skipCsrf = this.reflector.get<boolean>(CSRF_SKIP_KEY, handler);
      if (skipCsrf) {
        return true;
      }
  
      const tokenHeader = this.normalize(request.headers['x-csrf-token']);
      const tokenCookie = this.normalize(request.cookies?.['csrf_token']);

  
      if (!tokenHeader || !tokenCookie) {
        throw new ForbiddenException('CSRF token missing');
      }

      const [raw, sig] = tokenHeader.split('.')
      if (!raw || !sig) 
        throw new ForbiddenException('Malformed CSRF token');
      const validSig = createHmac('sha256', this.configService.get('CSRF_SECRET')!).update(raw).digest('hex');
      if (sig !== validSig) 
        throw new ForbiddenException('Invalid CSRF token');
  

      const tokenBuffer = Buffer.from(tokenHeader, 'utf8');
      const cookieBuffer = Buffer.from(tokenCookie, 'utf8');
  
      if (
        tokenBuffer.length !== cookieBuffer.length ||
        !timingSafeEqual(tokenBuffer, cookieBuffer) // suitable for comparing HMAC digests or secret values like authentication cookies or capability urls.
      ) {
        throw new ForbiddenException('Invalid CSRF token');
      }
  
      return true;
    }

    private normalize(input: string | string[] | undefined): string {
      if (!input) return '';
      return Array.isArray(input) ? input[0] : input;
    }
  }
  