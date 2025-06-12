/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../shared/services/email.service';
import {
  LoginDto,
  SignupDto,
  VerifyCodeDto,
  ResetPasswordDto,
} from './dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { randomInt, createHash, randomUUID } from 'crypto';
import Redis from 'ioredis';
import { UAParser } from 'ua-parser-js';
import { Request } from 'express';
import { RolesService } from '../role/role.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private rolesService: RolesService, 
    @Inject('REDIS')
    private readonly redis: Redis
  ) {}

  // Abstract signup with consolidated logic
  async signup(signupDto: SignupDto) {
      const existingUser = await this.usersService.findByEmail(signupDto.email);
      if (existingUser?.isEmailVerified) {
        // If user verified his/her email => Already have an account
        // If existingUser is null, falsy expression (?) skips if statement
        throw new BadRequestException('This email already has an account');
      }

      const userData = {
        ...signupDto,
        password: await this.hashPassword(signupDto.password),
        verificationCode: this.generateVerificationCode(),
        verificationCodeExpiresAt: this.getVerificationCodeExpiry(),
        isEmailVerified: false,
      };

      let user: User
      if (existingUser) {
        user = await this.usersService.update(existingUser.id, userData);
      } else {
        // Create new user and assign default role
        user = await this.usersService.create(userData)
        await this.rolesService.assignRole(user.id, 'user');
      }

      // Send verification email
      await this.emailService.sendVerificationCode(user.email, userData.verificationCode);

      return {
        message: 'Signing up successfully. Check your email for verification code!',
        verificationEmailSent: true,
        user: this.usersService.getPublicUserFields(user),
      };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (await bcrypt.compare(password, user.password)) {
      return this.usersService.getPublicUserFields(user);
    } else {
      throw new BadRequestException('Wrong password entered');
    }
  }

  async login(loginDto: LoginDto, req: Request) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const ef_rf_token = this.generateRfToken(user)
    const hashed_ef_rf_token = createHash('sha256').update(ef_rf_token).digest('hex')
    const payload = this.jwtService.decode(ef_rf_token) as any;
    const key = `refresh:${user.id}:${payload.jti}`
    // Extract info
    const ip = req?.ip;
    const ua = req.headers['user-agent'] || 'unknown';
    const parsedUa = UAParser(ua);
    const { os, device } = parsedUa
    const deviceInfo = `${ os.name } on ${ device.type }`;

    const data = {
      hash: hashed_ef_rf_token,
      ua,
      ip,
      createdAt: new Date().toISOString(),
      deviceInfo,
    };

    await this.redis.set(key, JSON.stringify(data), 'EX', 30 * 24 * 3600);
    await this.usersService.update(user.id, { lastLogin: new Date() });

    return {
      ef_ac_token: this.generateToken(user),
      ef_rf_token,
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  
  async verifyEmail(verifyCodeDto: VerifyCodeDto) {
    const user = await this.usersService.findByEmail(verifyCodeDto.email);

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (
      !user.verificationCode ||
      user.verificationCode !== verifyCodeDto.code
    ) {
      throw new BadRequestException('Invalid verification code');
    }

    if (new Date() > user.verificationCodeExpiresAt) {
      throw new BadRequestException('Verification code has expired');
    }

    await this.usersService.update(user.id, {
      isEmailVerified: true,
      verificationCode: undefined,
      verificationCodeExpiresAt: undefined,
    });

    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: true,
      },
    };
  }


  async resendVerificationCode(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiresAt = this.getVerificationCodeExpiry();

    await this.usersService.update(user.id, {
      verificationCode,
      verificationCodeExpiresAt,
    });

    await this.emailService.sendVerificationCode(email, verificationCode);

    return {
      message: 'Verification code sent successfully',
      verificationEmailSent: true,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  private generateVerificationCode(): string {
    return randomInt(100000, 1000000).toString()
  }

  private getVerificationCodeExpiry(): Date {
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 10); // Code expires in 10 minutes
    return expiryDate;
  }

  private generateToken(user: Partial<User>) {
    const payload = {
      email: user.email,
      sub: user.id,
    };
    return this.jwtService.sign(payload, {expiresIn: '2m'});
  }

  private generateRfToken(user: Partial<User>) {
    // Trong payload của refresh token, thêm trường jti
    const jti = randomUUID();
    const payload = {
      email: user.email,
      sub: user.id,
      type: 'refresh',
      jti
    };
    return this.jwtService.sign(payload, { expiresIn: '30d' });
  }


  async refreshToken(refreshToken: string) {
    // 1. Validate refresh token and load user
    const payload = this.jwtService.verify(refreshToken)
    if (payload?.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type, refresh token required');
    }
    const user = await this.usersService.findByIdOrThrow(payload.sub)

    // 2. Check the old refresh token key
    const oldKey = `refresh:${user.id}:${payload.jti}`
    const {isTokenValid, value: storedRaw} = await this.validateRefreshToken(oldKey, refreshToken)
    if (!isTokenValid || !storedRaw) {
      throw new UnauthorizedException('Refresh token not valid');
    }

    // 3. Parse into obj
    const storedData = JSON.parse(storedRaw) as { 
      hash: string;
      ua: string;
      ip: string;
      createdAt: string;
      deviceInfo: string;
    }

    // 4. Rotation process
    await this.redis.del(oldKey);
    const newRfToken = this.generateRfToken(user);
    const newPayload = this.jwtService.decode(newRfToken) as any;
    const newHashed = createHash('sha256').update(newRfToken).digest('hex');
    const newKey = `refresh:${user.id}:${newPayload.jti}`;
    const newData = {
      ...storedData,
      hash: newHashed,
      // createdAt: new Date().toISOString(),
    };
    await this.redis.set(newKey, JSON.stringify(newData), 'EX', 30 * 24 * 3600);

    return {
      ef_ac_token: this.generateToken(user),
      ef_rf_token: newRfToken,
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    };
  }


  async handleLogOut(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken)
    if (payload?.type !== 'refresh') {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const user = await this.usersService.findByIdOrThrow(payload.sub)
    const key = `refresh:${user.id}:${payload.jti}`;
    const { isTokenValid, value } = await this.validateRefreshToken(key, refreshToken)
    if (!isTokenValid || !value) {
      throw new UnauthorizedException('Refresh token not valid');
    }

    await this.redis.del(key);
    return { message: 'Logged out' };
  }


  async validateRefreshToken(key: string, token: string): Promise<{ isTokenValid: boolean, value?: string}> {
    // Case 1: Key disappeared in Redis
    const stored = await this.redis.get(key);
    if (!stored) 
      return { isTokenValid: false };

    // Case 2: Compare failed
    const parsed = JSON.parse(stored);
    const hashed = createHash('sha256').update(token).digest('hex');
    return {
      isTokenValid: parsed.hash === hashed,
      value: parsed.hash === hashed ? stored : undefined
    };
  }


  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    const resetCode = this.generateVerificationCode();
    const resetCodeExpiresAt = this.getVerificationCodeExpiry();

    await this.usersService.update(user.id, {
      passwordResetCode: resetCode,
      passwordResetCodeExpiresAt: resetCodeExpiresAt,
      resetCodeAttempts: 0,
    });

    await this.emailService.sendPasswordResetCode(email, resetCode);
    return {
      message: "Reset code has been sent."
    }
  }


  async verifyPassCode(email: string, resetCode: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user.passwordResetCode || !user.passwordResetCodeExpiresAt) {
      throw new BadRequestException("No reset code requested.");
    }
  
    if (new Date() > user.passwordResetCodeExpiresAt) {
      throw new BadRequestException("Expired reset code.");
    }

    if (user.resetCodeAttempts >= 5) {
      throw new BadRequestException("Too many failed attempts. Please request a new code.");
    }

    if (resetCode !== user.passwordResetCode) {
      await this.usersService.update(user.id, {
        resetCodeAttempts: user.resetCodeAttempts + 1,
      });
      throw new BadRequestException("Invalid reset code.");
    }

    await this.usersService.update(user.id, {
      resetCodeAttempts: 0,
      passwordResetCode: undefined,
      passwordResetCodeExpiresAt: undefined,
      canResetPassword: true,
    });

    return { message: "Reset code verified." }
  }


  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(resetPasswordDto.email);
    
    if (!user.canResetPassword) {
      throw new BadRequestException("Reset code not verified.");
    }

    const hashedPassword = await this.hashPassword(
      resetPasswordDto.newPassword,
    );

    await this.usersService.update(user.id, {
      password: hashedPassword,
      canResetPassword: false
      // passwordResetCode: undefined,
      // passwordResetCodeExpiresAt: undefined,
    });

    return {
      message: 'Password reset successfully',
    };
  }

  
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findOne(userId);

    if (!await bcrypt.compare(changePasswordDto.password, user.password)) {
      throw new BadRequestException('Password is incorrect');
    }
    const hashedNewPassword = await this.hashPassword(
      changePasswordDto.newPassword,
    );
    await this.usersService.update(user.id, {
      password: hashedNewPassword,
    });
  }
}

// async getUserSessions(userId: number) {
//   const keys = await this.redis.keys(`refresh:${userId}:*`);

//   const sessions = await Promise.all(
//     keys.map(async (key) => {
//       const value = await this.redis.get(key);
//       if (!value) return null;

//       try {
//         const data = JSON.parse(value);
//         const parts = key.split(':');
//         const jti = parts[2];

//         return {
//           jti,
//           device: data.device,
//           ip: data.ip,
//           ua: data.ua,
//           createdAt: data.createdAt,
//         };
//       } catch (e) {
//         return null; // ignore corrupt entries
//       }
//     }),
//   );

//   return sessions.filter(Boolean); // remove null
// }
