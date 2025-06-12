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
import { UserDailyActivity } from 'src/statistics/entities';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Topic,
      Card,
      Set,
      User,
      UserCardReview,
      UserDailyActivity,
      UserCardReviewLog,
      Notification,
    ]),
    forwardRef(() => CardsModule),
    SharedModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
