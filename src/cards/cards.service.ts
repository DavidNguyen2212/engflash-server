import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Card,
  Set,
  Topic,
  UserCardReview,
  UserCardReviewChoice,
  UserCardReviewLog,
} from './entities';
import {
  AIExampleDTO,
  ModifyExampleDTO,
  NewMeaningDTO,
  ReviewCardDTO,
} from './dto';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OpenAIService } from 'src/shared/services/openai.service';
import { capitalizeFirstLetter } from '../common/utils/capitalizer.util';
import { UserDailyActivity } from 'src/statistics/entities';
import { User } from 'src/users/entities';

@Injectable()
export class CardsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(Set)
    private setRepository: Repository<Set>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserCardReview)
    private reviewRepository: Repository<UserCardReview>,
    @InjectRepository(UserCardReviewChoice)
    private choiceRepository: Repository<UserCardReviewChoice>,
    @InjectRepository(UserDailyActivity)
    private dailyActivityRepository: Repository<UserDailyActivity>,
    @InjectRepository(UserCardReviewLog)
    private reviewLogRepository: Repository<UserCardReviewLog>,
    private openaiService: OpenAIService,
  ) {}

  async generateAIGrammar(user_id: string, card_id: number) {
    const card = await this.cardRepository.findOne({
      where: {
        card_id,
        user: {
          id: parseInt(user_id),
        },
      },
      relations: ['user'],
    });

    if (!card) {
      throw new NotFoundException(
        `Card with ID ${card_id} not found or does not belong to user ${user_id}`,
      );
    }

    const result = await this.openaiService.generateAIGrammar(
      card.front_text,
      card.back_text,
      card.example,
    );
    card.grammar_markdown = result.grammar_markdown;
    await this.cardRepository.save(card);
    return {
      card_id,
      grammar_markdown: result.grammar_markdown,
    };
  }

  async getMeaningfromAI(providedData: AIExampleDTO) {
    return await this.openaiService.getMeaning(
      providedData.front_text,
      providedData.back_text,
    );
  }

  async modifyCardExample(user_id: string, payload: ModifyExampleDTO) {
    const {
      card_id,
      front_text,
      back_text = '',
      example = '',
      example_meaning = '',
    } = payload;
    const updateData: any = {};

    if (front_text && front_text.trim() !== '') {
      updateData.front_text = front_text;
    }
    if (back_text && back_text.trim() !== '') {
      updateData.back_text = back_text;
    }
    if (example && example.trim() !== '') {
      updateData.example = example;
    }
    if (example_meaning && example_meaning.trim() !== '') {
      updateData.example_meaning = example_meaning;
    }

    const cards = await this.cardRepository
      .createQueryBuilder()
      .update()
      .set(updateData)
      .where('card_id = :card_id AND user_id = :user_id', { card_id, user_id })
      .execute();

    return { cards };
  }

  async addCardtoTopic(user_id: string, payload: any) {
    const user = await this.userRepository.findOne({
      where: {
        id: Number(user_id),
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ${user_id} not found!`);
    }
    // Destructure và gán giá trị mặc định
    const {
      front_text = '',
      back_text = '',
      example = '',
      topic_id = null,
    } = payload;

    const updateData: any = {};

    if (front_text && front_text.trim() !== '') {
      updateData.front_text = front_text;
    }
    if (back_text && back_text.trim() !== '') {
      updateData.back_text = back_text;
    }
    if (example && example.trim() !== '') {
      updateData.example = example;
    }

    const aiResult = await this.openaiService.getIPAandMeaning(
      updateData.front_text || front_text,
      updateData.example || example,
    );

    updateData.example_meaning = aiResult.vietnamese_meaning;
    updateData.ipa_pronunciation = `/${aiResult.ipa}/`;
    if (!updateData.example) updateData.example = aiResult.example;

    // Nếu có topic_id, gán cho quan hệ topic dưới dạng object chứa khóa chính
    if (topic_id) {
      updateData.topic = { topic_id: topic_id };
    } else {
      // Get all the topic belong to user_id
      // Create new topic: aiResult.topic
      const preNewTopic = this.topicRepository.create({
        topic_name: aiResult.topic_name,
        topic_description: aiResult.topic_description,
        is_default: false,
        user: user,
      });

      const newTopic = await this.topicRepository.save(preNewTopic);
      updateData.topic = { topic_id: newTopic.topic_id };
    }

    // Gán cho quan hệ user (convert user_id từ string sang number nếu cần)
    updateData.user = { id: Number(user_id) };

    // Insert bản ghi mới
    const cards = await this.cardRepository.insert(updateData);

    return { cards };
  }

  async deleteCard(user_id: string, card_id: number) {
    const card = await this.cardRepository.findOne({
      where: {
        card_id,
        user: {
          id: parseInt(user_id),
        },
      },
      relations: ['user'],
    });

    if (!card) {
      throw new NotFoundException(
        `Card with ID ${card_id} not found or does not belong to user ${user_id}`,
      );
    }

    await this.cardRepository.delete({ card_id });
    return { message: `Card with ID ${card_id} deleted successfully` };
  }

  async getSingleMeaning(wordData: NewMeaningDTO) {
    return await this.openaiService.getSingleMeaning(
      wordData.front_text,
      wordData.cover_sentence,
    );
  }

  async swipeCard(userId: number, { card_id, rating }: ReviewCardDTO) {
    const card = await this.cardRepository.findOne({
      where: { card_id, user: { id: userId } },
    });
    if (!card) throw new NotFoundException('Card not found');

    let review = await this.reviewRepository.findOne({
      where: {
        card: { card_id },
        user: { id: userId },
      },
      relations: ['card', 'user'],
    });

    const now = new Date();
    const isFirstReview = !review;

    if (!review) {
      review = this.reviewRepository.create({
        user: { id: userId },
        card: { card_id },
        ease_factor: 2.5,
        interval: 0,
        repetitions: 0,
        last_review_date: now,
        next_review_date: now,
      });
    }

    if (rating === 'good') {
      review.repetitions += 1;
      review.ease_factor = Math.max(1.3, review.ease_factor + 0.1);
      if (review.repetitions === 1) {
        review.interval = 1;
      } else if (review.repetitions === 2) {
        review.interval = 6;
      } else {
        review.interval = Math.round(review.interval * review.ease_factor);
      }
    } else {
      review.repetitions = 0;
      review.interval = 1;
      review.ease_factor = Math.max(1.3, review.ease_factor - 0.2);
    }

    review.last_review_date = now;
    // review.next_review_date = new Date(
    //   now.getTime() + review.interval * 24 * 60 * 60 * 1000
    // )
    review.next_review_date = new Date(
      now.getTime() + review.interval * 10 * 1000, // 10s mỗi lần ôn
    );

    const savedReview = await this.reviewRepository.save(review);
    if (isFirstReview) {
      const choices = await this.openaiService.createMultipleChoice(
        card.front_text,
        card.back_text,
      );
      const choiceEntities = choices.map((text) =>
        this.choiceRepository.create({
          text,
          isCorrect: text === capitalizeFirstLetter(card.back_text),
          review: savedReview,
        }),
      );
      await this.choiceRepository.save(choiceEntities);
    }

    await this.updateDailyActivity(userId);
    await this.reviewLogRepository.save(
      this.reviewLogRepository.create({
        user: { id: userId },
        card: { card_id },
        rating,
        reviewed_at: now,
      }),
    );
    return savedReview;
  }

  async updateDailyActivity(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.dailyActivityRepository.findOne({
      where: {
        user: { id: userId },
        date: today,
      },
    });

    if (!existing) {
      const activity = this.dailyActivityRepository.create({
        user: { id: userId },
        date: today,
      });
      await this.dailyActivityRepository.save(activity);
    }
  }
}
