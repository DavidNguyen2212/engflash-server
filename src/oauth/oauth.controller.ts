import { Body, Controller, Get, Inject, Post, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OauthService } from './oauth.service';
import { ExchangeSessionDto, OauthQueries } from './dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';
import Redis from 'ioredis';

@ApiTags('Oauth')
@Controller('oauth')
export class OauthController {
    constructor(
        private readonly oauthService: OauthService,
        private readonly configService: ConfigService,
        @Inject('REDIS')
        private readonly redis: Redis
    ) {}

    @Get('google')
    @ApiOperation({
        summary: 'Redirect and get access token',
        description: 'Get access token',
    })
    async handleGoogleOAuth(@Query() query: OauthQueries, @Req() req: Request, @Res() res: Response) {
        const result = await this.oauthService.handleGoogleOAuth(query.code, req)
        
        // Case: mobile client
        // This header's metadata injected by React native
        const isMobile = req.headers['x-client-type'] === 'mobile'
        if (isMobile) {
            const sessionKey = `oauth_session:${randomUUID()}`
            await this.redis.set(sessionKey, JSON.stringify(result), 'EX', 300) // 5'
            const url = `${this.configService.get('MOBILE_REDIRECT_CALLBACK')}?session=${sessionKey}`
            return res.redirect(url)
        }

        // Case: web client
        // Set cookie
        res.cookie('ef_ac_token', result.ef_ac_token, {
            // domain: '.engflash.com', only set in production
            httpOnly: true,
            path: '/',
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 5 * 60 * 1000 // 5'
        })
        const raw = randomUUID();
        const signature = createHmac('sha256', this.configService.get('CSRF_SECRET')!).update(raw).digest('hex');
        const signedCsrfToken = `${raw}.${signature}`;
        res.cookie('ef_csrf_token', signedCsrfToken, {
            httpOnly: false, // FE can read to put it in x-csrf-token
            sameSite: 'strict',
            path: '/',
            secure: this.configService.get('NODE_ENV') === 'production',
            maxAge: 5 * 60 * 1000 // 5'
          });
        res.cookie('ef_rf_token', result.ef_rf_token, {
            // domain: '.engflash.com', only set in production
            httpOnly: true,
            path: '/',
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30ng
        })
        const queryObject = {
            new_user: String(result.new_user),
            status: 'success'
        }
        const queryString = new URLSearchParams(queryObject).toString()
        const url = `${this.configService.get('CLIENT_REDIRECT_CALLBACK')}?${queryString}`
        
        return res.redirect(url) 
    }

    // For mobile app (use Redis)
    // Will get access token and put it in Authorization header
    @Post('session/exchange')
    @ApiOperation({
        summary: 'Redirect and get access token for mobile app',
        description: 'Get access token',
    })
    async exchangeSession(@Body() exchangeData: ExchangeSessionDto) {
        return this.oauthService.exchangeSession(exchangeData.sessionKey);
    }
}
