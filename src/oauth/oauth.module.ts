import { Module } from '@nestjs/common';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../role/role.module';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    HttpModule,
    AuthModule,
    JwtModule,
    RedisModule,
    RolesModule,
  ],
  controllers: [OauthController],
  providers: [OauthService],
  exports: [OauthService],
})
export class OauthModule {}
