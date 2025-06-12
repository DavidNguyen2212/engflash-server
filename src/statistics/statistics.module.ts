import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { CardsModule } from '../cards/cards.module';
import {
  Card,
  Topic,
  UserCardReview,
  UserCardReviewLog,
} from 'src/cards/entities';
import { User } from 'src/users/entities';
import { SharedModule } from 'src/shared/shared.module';
import { UserDailyActivity } from './entities/activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Topic,
      Card,
      User,
      UserCardReview,
      UserDailyActivity,
      UserCardReviewLog,
    ]),
    forwardRef(() => CardsModule),
    SharedModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
