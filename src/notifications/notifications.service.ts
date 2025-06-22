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
import { User } from 'src/users/entities';
import { OpenAIService } from 'src/shared/services/openai.service';
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
    @InjectRepository(UserCardReviewLog)
    private reviewLogRepository: Repository<UserCardReviewLog>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private openaiService: OpenAIService,
  ) {}

  async updateSetAdmin(userId: number, data: UpdateSetDTO) {
    
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
