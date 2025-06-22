// src/messaging/consumers/card-review.consumer.ts
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { OpenAIService } from '../../shared/services/openai.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserCardReview, UserCardReviewChoice, UserCardReviewLog } from '../../cards/entities';
import { Repository } from 'typeorm';
import { capitalizeFirstLetter } from '../../common/utils';

@Controller()
export class CardReviewConsumer {
  private readonly logger = new Logger(CardReviewConsumer.name);
  constructor(
    private readonly openaiService: OpenAIService,
    @InjectRepository(UserCardReviewChoice)
    private readonly choiceRepository: Repository<UserCardReviewChoice>,
    @InjectRepository(UserCardReviewLog)
    private readonly reviewLogRepository: Repository<UserCardReviewLog>,
    @InjectRepository(UserCardReview)
    private readonly reviewRepository: Repository<UserCardReview>,
  ) {}

  @EventPattern('card.review.created')
  async handleCardReviewCreated(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const {
      userId, cardId, rating, event_type,
      isFirstReview, cardFront, cardBack, reviewId, time,
    } = data;
  
    // Save review log
    await this.reviewLogRepository.save(
      this.reviewLogRepository.create({
      user: { id: userId },
      card: { card_id: cardId },
      rating,
      event_type,
      reviewed_at: time,
    }));
  
    // Nếu lần đầu => gọi AI tạo câu hỏi trắc nghiệm
    if (isFirstReview) {
      const review = await this.reviewRepository.findOne({
        where: { id: reviewId },
      });

      if (!review) {
        throw new Error('No reviewed')
      }
  
      const choices = await this.openaiService.createMultipleChoice(
        cardFront,
        cardBack,
      );
  
      const choiceEntities = choices.map((text) =>
        this.choiceRepository.create({
          text,
          isCorrect: text === capitalizeFirstLetter(cardBack),
          review: { id: reviewId },
        })
      );
  
      await this.choiceRepository.save(choiceEntities);
  }
  }
}