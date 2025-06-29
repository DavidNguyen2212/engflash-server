import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies';
import { SharedModule } from '../shared/shared.module';
import { RolesModule } from 'src/role/role.module';
import { RedisModule } from 'src/redis/redis.module';
import { EmailQueueModule } from '../rabbitmq/emails/emailQueue.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    SharedModule,
    RolesModule,
    RedisModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
    EmailQueueModule
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
