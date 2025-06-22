import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { TopicsModule } from 'src/topics/topics.module';
import { SetsModule } from 'src/sets/sets.module';
import {
  Card,
  Set,
  Topic,
  UserCardReview,
  UserCardReviewChoice,
  UserCardReviewLog,
} from './entities';
import { SharedModule } from 'src/shared/shared.module';
import { User } from 'src/users/entities';
import { CardQueueModule } from '../rabbitmq/cards/cardQueue.module';

@Module({
  // We need forwardRef because we are importing the CardsModule in the TopicsModule and the SetsModule
  // and we need to avoid circular dependency
  imports: [
    TypeOrmModule.forFeature([
      Card,
      Topic,
      Set,
      User,
      UserCardReview,
      UserCardReviewChoice,
      UserCardReviewLog,
    ]),
    forwardRef(() => TopicsModule),
    forwardRef(() => SetsModule),
    SharedModule,
    CardQueueModule,
  ],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
