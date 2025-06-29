import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardsModule } from '../cards/cards.module';
import {
  Card,
  Set,
  Topic,
  UserCardReview,
  UserCardReviewLog,
} from 'src/cards/entities';
import { User } from 'src/users/entities';
import { SharedModule } from 'src/shared/shared.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../role/role.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Topic,
      Card,
      Set,
      User,
      UserCardReview,
      UserCardReviewLog,
      Notification,
      NotificationRecipient
    ]),
    forwardRef(() => CardsModule),
    SharedModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    RolesModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
