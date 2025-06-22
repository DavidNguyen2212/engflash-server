import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../shared/services/openai.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserCardReview, UserCardReviewChoice, UserCardReviewLog } from '../../cards/entities';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { capitalizeFirstLetter } from '../../common/utils';
import { TransactionalRunner } from '../../common/decorators';
// import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class CardQueueService {
  private readonly transactionalRunner: TransactionalRunner
  private logger = new Logger(CardQueueService.name)
  constructor(
    // private readonly logger: PinoLogger,
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
    // this.logger.setContext(QueueService.name)
  }

  async resolveCardReviewCreated(data: any) {
    const { userId, cardId, rating, eventType, cardFrontText, cardBackText, reviewedAt } = data;
    const time = new Date(reviewedAt);
    this.logger.log(`🔄 Starting transaction for card ${cardId}`);

    return this.transactionalRunner.runWithRetry(
      async (queryRunner: QueryRunner) => {
         // 1. Create a fresh review / fetch the current review
         let review = await queryRunner.manager.findOne(UserCardReview, {
          where: {
            card: { card_id: cardId },
            user: { id: userId },
          },
          relations: ['card', 'user'],
        });

        const isFirstReview = !review;
        if (!review) {
          review = queryRunner.manager.create(UserCardReview, {
            user: { id: userId },
            card: { card_id: cardId },
            ease_factor: 2.5,
            interval: 0,
            repetitions: 0,
            last_review_date: time,
            next_review_date: time,
          });
        }

        // 2. Apply spaced repetition algorithm
        if (rating === 'good') {
          review.repetitions += 1;
          review.ease_factor = Math.max(1.3, review.ease_factor + 0.1);
          review.interval = review.repetitions === 1 ? 1 :
                            review.repetitions === 2 ? 6 :
                            Math.round(review.interval * review.ease_factor);
        } else {
          review.repetitions = 0;
          review.interval = 1;
          review.ease_factor = Math.max(1.3, review.ease_factor - 0.2);
        }

        review.last_review_date = time;
        review.next_review_date = new Date(time.getTime() + review.interval * 24 * 60 * 60 * 1000);

        // 3. Save the review rec
        const savedReview = await queryRunner.manager.save(UserCardReview, review);
        this.logger.log(`💾 Review saved for card ${cardId}`);

        // 4. Save review log
        await queryRunner.manager.save(
          UserCardReviewLog, 
          queryRunner.manager.create(UserCardReviewLog, {
              user: { id: userId },
              card: { card_id: cardId },
              rating,
              event_type: eventType,
              reviewed_at: time,
          })
        )
        this.logger.log(`📝  Review log saved for card ${cardId}`);

        // Fresh record => create MCQ by openai
        if (isFirstReview) {
          try {
            this.logger.log(`🤖 Generating choices for card ${cardId}`);
            const choices = await this.openaiService.createMultipleChoice(
              cardFrontText, // Use data from event
              cardBackText,
            );

            const choiceEntities = choices.map((text) =>
              queryRunner.manager.create(UserCardReviewChoice, {
                text,
                isCorrect: text === capitalizeFirstLetter(cardBackText), // Use data from event
                review: { id: savedReview.id },
              })
            );

            await queryRunner.manager.save(UserCardReviewChoice, choiceEntities);
            this.logger.log(`✅ Created ${choiceEntities.length} choices for card ${cardId}`);
            
          } catch (aiError) {
            this.logger.error({
              userId,
              cardId,
              reviewId: savedReview.id,
              error: aiError.message,
              operation: 'ai_generation_failed'
            }, `❌ AI generation failed for card ${cardId}`);
          }
        } 

        this.logger.log(`✅ Transaction completed successfully for card ${cardId}`);
        return { success: true, cardId }
      },
      3,
      30000
    )
  }
}
