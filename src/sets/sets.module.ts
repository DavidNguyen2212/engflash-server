import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Set } from './entities';
import { SetsController } from './sets.controller';
import { SetsService } from './sets.service';
import { CardsModule } from 'src/cards/cards.module';
import { Card, UserCardReview } from 'src/cards/entities';
import { User } from 'src/users/entities';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Set, Card, User, UserCardReview]),
    forwardRef(() => CardsModule),
    SharedModule,
  ],
  controllers: [SetsController],
  providers: [SetsService],
  exports: [SetsService],
})
export class SetsModule {}
