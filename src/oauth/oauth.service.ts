import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { AuthService } from '../auth/auth.service';
import { Request } from 'express';
import * as generator from 'generate-password';
import { User } from '../users/entities';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { UAParser } from 'ua-parser-js';
import Redis from 'ioredis';
import { SignupDto } from '../auth/dto';
import { RolesService } from '../role/role.service';
import {
  GoogleOAuthBody,
  GoogleOAuthResponse,
  GoogleTokenResponse,
  GoogleUserInfo,
} from './interface';
import { OAUTH_CONFIG, REDIS_CONFIG } from './constant';

@Injectable()
export class OauthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly rolesService: RolesService,
    @Inject('REDIS')
    private readonly redis: Redis,
  ) {}

  // Trong OauthService sẽ định nghĩa các phương thức login và signup riêng
  // Tiện sau này mở rộng mà không đụng chạm tới auth truyền thống
  // Nhằm tách bạch logic
  async handleGoogleOAuth(code: string, req: Request) {
    console.log(code);
    const { access_token, id_token } = await this.getGoogleOAuthToken(code);
    // id_token trong data, giải mã với jwt.io sẽ lấy được payload
    // hoặc gọi lên api cx được
    const userInfo = await this.getGoogleUserInfo(access_token, id_token);
    if (!userInfo.verified_email) {
      throw new BadRequestException('Email not verifiied');
    }
    const user = await this.usersService.findByEmail(userInfo.email);
    if (user) {
      return await this.directLogin(user, req, false);
    } else {
      const { user } = await this.signup({
        email: userInfo.email,
        name: `${userInfo.given_name} ${userInfo.family_name}`.trim(),
        password: this.generateSecurePassword(),
        avatarUrl: userInfo.picture,
      });
      return await this.directLogin(user, req, true);
    }
  }

  private async getGoogleOAuthToken(code: string) {
    const body: GoogleOAuthBody = {
      code,
      client_id: this.configService.get('GOOGLE_CLIENT_ID', ''),
      client_secret: this.configService.get('GOOGLE_CLIENT_SECRET', ''),
      redirect_uri: this.configService.get(
        'GOOGLE_AUTHORIZED_REDIRECT_URI',
        '',
      ),
      grant_type: 'authorization_code',
    };

    const response$ = this.httpService
      .post('https://oauth2.googleapis.com/token', body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .pipe(
        catchError((error: AxiosError) => {
          throw new BadGatewayException(
            `Failed to get OAuth token: ${error.message}`,
          );
        }),
      );
    const { data } = await firstValueFrom(response$);
    return data as GoogleTokenResponse;
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await firstValueFrom(
      this.httpService
        .get('https://www.googleapis.com/oauth2/v1/userinfo', {
          params: { access_token, alt: 'json' },
          headers: { Authorization: `Bearer ${id_token}` },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new BadGatewayException('Failed to get user info');
          }),
        ),
    );
    return data as GoogleUserInfo;
  }

  private async directLogin(user: User, req: Request, new_user: boolean) {
    const refresh_token = this.authService.generateRfToken(user);
    const hashed = createHash('sha256').update(refresh_token).digest('hex');
    const payload = this.jwtService.decode(refresh_token);
    const key = `refresh:${user.id}:${payload.jti}`;

    const ip = req?.ip;
    const ua = req.headers['user-agent'] || 'unknown';
    const parsedUa = UAParser(ua);
    const { os, device } = parsedUa;
    const deviceInfo = `${os.name} on ${device.type}`;

    await this.redis.set(
      key,
      JSON.stringify({
        hash: hashed,
        ua,
        ip: ip,
        createdAt: new Date().toISOString(),
        device: deviceInfo,
      }),
      'EX',
      REDIS_CONFIG.RFTOKEN_MAX_AGE,
    );

    await this.usersService.update(user.id, { lastLogin: new Date() });

    return {
      access_token: this.authService.generateToken(user),
      refresh_token,
      user: this.usersService.getPublicUserFields(user),
      new_user,
    } as GoogleOAuthResponse;
  }

  private async signup(signupDto: SignupDto) {
    const userData = {
      ...signupDto,
      password: await this.authService.hashPassword(signupDto.password),
      verificationCode: undefined,
      verificationCodeExpiresAt: undefined,
      isEmailVerified: true,
    };

    // Create new user and assign default role
    const user = await this.usersService.create(userData);
    const user_with_roles = await this.rolesService.assignRole(user.id, 'user');

    return {
      message: 'Signing up successfully!',
      user: user_with_roles,
    };
  }

  private generateSecurePassword(): string {
    return generator.generate({
      length: OAUTH_CONFIG.PASSWORD_LENGTH,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      strict: true,
      excludeSimilarCharacters: true,
    });
  }

  // Mobile only
  async exchangeSession(sessionKey: string): Promise<GoogleOAuthResponse> {
    const sessionData = await this.redis.get(sessionKey);
    if (!sessionData) {
      throw new BadRequestException('Invalid or expired session');
    }
    await this.redis.del(sessionKey);
    return JSON.parse(sessionData);
  }
}
