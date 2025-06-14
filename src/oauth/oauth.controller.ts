import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OauthService } from './oauth.service';
import { ExchangeSessionDto, OauthQueries } from './dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';
import Redis from 'ioredis';
import { OAUTH_CONFIG, REDIS_CONFIG } from './constant';
import { SetCookies } from '../auth/utils';

@ApiTags('Oauth')
@Controller('oauth')
export class OauthController {
  constructor(
    private readonly oauthService: OauthService,
    private readonly configService: ConfigService,
    @Inject('REDIS')
    private readonly redis: Redis,
  ) {}

  @Get('google')
  @ApiOperation({
    summary: 'Login by Google',
    description:
      'Get tokens completely (web client), get session only (mobile client)',
  })
  async handleGoogleOAuth(
    @Query() query: OauthQueries,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.oauthService.handleGoogleOAuth(query.code, req);

    // Case: mobile client
    // This header's metadata injected by React native
    const isMobile = req.headers['x-client-type'] === 'mobile';
    if (isMobile) {
      const sessionKey = `oauth_session:${randomUUID()}`;
      await this.redis.set(
        sessionKey,
        JSON.stringify(result),
        'EX',
        REDIS_CONFIG.SESSION_MAX_AGE,
      ); // 5'
      const url = `${this.configService.get('MOBILE_REDIRECT_CALLBACK')}?session=${sessionKey}`;
      return res.redirect(url);
    }

    // Case: web client
    // Set cookie
    SetCookies({ 
      req, res, 
      tokens: {
        access_token: result.access_token,
        refresh_token: result.refresh_token
      }, 
      node_env: this.configService.get('NODE_ENV')!, 
      csrf_secret: this.configService.get('CSRF_SECRET')!, 
      maxAge: {
        accessToken: OAUTH_CONFIG.ACTOKEN_MAX_AGE,
        refreshToken: OAUTH_CONFIG.RFTOKEN_MAX_AGE
      }
    })

    const queryObject = {
      new_user: String(result.new_user),
      status: 'success',
    };
    const queryString = new URLSearchParams(queryObject).toString();
    const url = `${this.configService.get('CLIENT_REDIRECT_CALLBACK')}?${queryString}`;

    return res.redirect(url);
  }

  // For mobile app (use Redis)
  // Will get access token and put it in Authorization header
  @Post('session/exchange')
  @ApiOperation({
    summary: 'Get tokens for mobile app',
    description: 'Get tokens completely for mobile app (final step)',
  })
  async exchangeSession(@Body() exchangeData: ExchangeSessionDto) {
    return this.oauthService.exchangeSession(exchangeData.sessionKey);
  }
}
