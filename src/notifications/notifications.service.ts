import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import {
  Card,
  Set,
  Topic,
  UserCardReview,
  UserCardReviewLog,
} from 'src/cards/entities';
import axios from 'axios';
import { User } from 'src/users/entities';
import { OpenAIService } from 'src/shared/services/openai.service';
import { DateTime } from 'luxon';
import { UserDailyActivity } from 'src/statistics/entities';
import { UpdateSetDTO } from './dto';
import { Notification } from './entities';

@Injectable()
export class NotificationsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserCardReview)
    private reviewRepository: Repository<UserCardReview>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(Set)
    private setRepository: Repository<Set>,
    @InjectRepository(UserDailyActivity)
    private dailyActivityRepository: Repository<UserDailyActivity>,
    @InjectRepository(UserCardReviewLog)
    private reviewLogRepository: Repository<UserCardReviewLog>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private openaiService: OpenAIService,
  ) {}

  async updateSetAdmin(userId: number, data: UpdateSetDTO) {
    const activities = await this.dailyActivityRepository.find({
      where: { user: { id: userId } },
      order: { date: 'DESC' },
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < activities.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      const activityDate = new Date(activities[i].date);
      activityDate.setHours(0, 0, 0, 0);

      if (activityDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return { streak };
  }

  async updateSet(id: number, dto: UpdateSetDTO) {
    const set = await this.setRepository.findOne({
      where: { set_id: id },
      relations: ['card', 'user'],
    });
    if (!set) throw new NotFoundException('Set not found');

    // (Ví dụ) cập nhật thông tin
    // Object.assign(set, dto);
    // return this.setRepository.save(set);
    return 'ok';
  }

  async notifySetUpdated(setId: number, updatedSet: any) {
    // Lấy danh sách user đã học ít nhất 1 thẻ trong set này
    const userIds = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.card', 'card')
      .select('DISTINCT review.user_id', 'user_id')
      .where('card.set_id = :setId', { setId })
      .getRawMany();

    for (const row of userIds) {
      await this.notificationRepository.save(
        this.notificationRepository.create({
          user: { id: row.user_id },
          type: 'set_updated',
          content: `Bộ từ '${updatedSet.name}' vừa được cập nhật. Hãy ôn lại nhé!`,
          data: { setId },
        }),
      );
    }
  }
}
