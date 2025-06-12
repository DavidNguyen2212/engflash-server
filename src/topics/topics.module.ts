import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from './entities';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { CardsModule } from '../cards/cards.module';
import { Card, UserCardReview } from 'src/cards/entities';
import { User } from 'src/users/entities';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Topic, Card, User, UserCardReview]),
    forwardRef(() => CardsModule),
    SharedModule,
  ],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}
