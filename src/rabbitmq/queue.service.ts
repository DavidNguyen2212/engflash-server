import { Inject, Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../shared/services/openai.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserCardReview, UserCardReviewChoice, UserCardReviewLog } from '../cards/entities';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { capitalizeFirstLetter } from '../common/utils';
import { TransactionalRunner } from '../common/decorators';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name)
  private readonly transactionalRunner: TransactionalRunner
  constructor(
    private readonly dataSource: DataSource,
    private readonly openaiService: OpenAIService,
    @InjectRepository(UserCardReviewChoice)
    private readonly choiceRepository: Repository<UserCardReviewChoice>,
    @InjectRepository(UserCardReviewLog)
    private readonly reviewLogRepository: Repository<UserCardReviewLog>,
    @InjectRepository(UserCardReview)
    private readonly reviewRepository: Repository<UserCardReview>,
  ) { 
    this.transactionalRunner = new TransactionalRunner(this.dataSource)
  }

  async resolveCardReviewCreated(data: any) {
    const {
      userId, cardId, rating, event_type,
      isFirstReview, cardFront, cardBack, reviewId, time,
    } = data;
    
    this.logger.log(`🔄 [QueueService] Starting transaction for card ${cardId}, review ${reviewId}`);

    return this.transactionalRunner.runWithRetry(
      async (queryRunner: QueryRunner) => {
        // Save review log
        await queryRunner.manager.save(
          UserCardReviewLog, 
          queryRunner.manager.create(UserCardReviewLog, {
              user: { id: userId },
              card: { card_id: cardId },
              rating,
              event_type,
              reviewed_at: time,
          })
        )

        this.logger.log(`📝 [QueueService] Review log saved for card ${cardId}`);

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
          const review = await queryRunner.manager.findOne(UserCardReview, {
            where: { id: reviewId },
          });

          if (!review) {
            throw new Error(`Review with ID ${reviewId} not found`);
          }
          
          this.logger.log(`🤖 [QueueService] Calling OpenAI for card ${cardId}`);
          const choices = await this.openaiService.createMultipleChoice(
            cardFront,
            cardBack,
          );
      
          const choiceEntities = choices.map((text) =>
            queryRunner.manager.create(UserCardReviewChoice, {
              text,
              isCorrect: text === capitalizeFirstLetter(cardBack),
              review: { id: reviewId },
            })
          );
      
          await queryRunner.manager.save(UserCardReviewChoice, choiceEntities);
          this.logger.log(`✅ [QueueService] Created ${choiceEntities.length} choices for card ${cardId}`);
        } 

        this.logger.log(`✅ [QueueService] Transaction completed successfully for card ${cardId}`);
        return { success: true, cardId, reviewId }
      },
      3,
      30000
    )
  }
}
