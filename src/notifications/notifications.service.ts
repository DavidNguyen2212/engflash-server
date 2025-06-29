import {
  BadRequestException,
  forwardRef,
  Inject,
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
  In,
} from 'typeorm';
import {
  Card,
  Set,
  Topic,
  UserCardReview,
  UserCardReviewLog,
} from 'src/cards/entities';
import { User } from 'src/users/entities';
import { NotificationRecipientDTO, PaginationQueryDto, UpdateSetDTO } from './dto';
import { Notification, NotificationRecipient } from './entities';
import { NotificationType, Channel } from './interface/notif.enum';
import { plainToInstance } from 'class-transformer';
import { NotificationsGateway } from './notifications.gateway';
import { BroadcastNotificationDto } from './dto';

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
    private notifRepository: Repository<Notification>,
    @InjectRepository(NotificationRecipient)
    private notifRecipientRepository: Repository<NotificationRecipient>,
    // @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway: NotificationsGateway,
  ) {}

  async findAll(userId: number, query: PaginationQueryDto): Promise<{ items: NotificationRecipientDTO[]; total: number }> {
    const limit = Math.min(query.limit || 20, 100) // max 100
    const page = Math.max(query.page || 1, 1)
    const skip = (page - 1) * limit

    const qb = this.notifRecipientRepository
      .createQueryBuilder("nr")
      .leftJoinAndSelect("nr.notification", "n")
      .where("nr.user_id = :userId", {userId})
      
    if (query.unreadOnly === 'true') {
      qb.andWhere("nr.read_at IS NULL")
    }

    const [entities, total] = await qb
      .orderBy("nr.created_at", 'DESC')
      .take(limit)
      .skip(skip)
      .getManyAndCount()

    const items = plainToInstance(NotificationRecipientDTO, entities, {
      excludeExtraneousValues: true
    })

    return { items, total }
    
  }

  async findOne(userId: number, recipientId: number): Promise<NotificationRecipientDTO> {
    const entity = await this.notifRecipientRepository.findOne({
      where: { id: recipientId, user: { id: userId } },
      relations: ['notification'],
    });
    if (!entity) {
      throw new NotFoundException('Notification không tồn tại');
    }

    return plainToInstance(NotificationRecipientDTO, entity, {
      excludeExtraneousValues: true,
    });
  }
  
  async markRead(userId: number, recipientId: number): Promise<void> {
    const { affected } = await this.notifRecipientRepository.update(
      { id: recipientId, user: { id: userId }, readAt: IsNull() },
      { readAt: () => 'NOW()' }
    )
    if (!affected) {
      throw new NotFoundException('Notification không tồn tại hoặc đã đọc');
    }
  }

  async markAllRead(userId: number, before?: Date): Promise<void> {
    const qb = this.notifRecipientRepository
      .createQueryBuilder()
      .update(NotificationRecipient)
      .set({ readAt: () => 'NOW()' })
      .where("user_id = :userId", { userId })
      .andWhere('read_at IS NULL')

    if (before) {
      qb.andWhere('created_at <= :before', { before })
    }

    await qb.execute()
  }

  // sendSystemNotify(data: any) {
  //   this.gateway.server.emit('notification:new', data);
  // }

  // sendToUser(userId: string, payload: any) {
  //   this.gateway.server
  //     .to(`user:${userId}`)
  //     .emit('notification:new', payload);
  // }

  // /** Gửi cho mọi user đang subscribe 1 category */
  // sendToCategory(category: string, payload: any) {
  //   this.gateway.server
  //     .to(`category:${category}`)
  //     .emit('notification:new', payload);
  // }

  /** Gửi broadcast toàn hệ thống */
  async broadcastSystem(payload: BroadcastNotificationDto) {
    const { title, content, roles } = payload
    // 1. Lưu vào db
    const notif = await this.notifRepository.save(this.notifRepository.create({
      notif_type: NotificationType.SYSTEM,
      title,
      content,
      linkTo: "new_policy.txt",
      channels: [Channel.IN_APP, Channel.PUSH]
    }))

    const users = await this.userRepository.find({
      // where: {
      //   roles: In(['user'])
      // },
      // relations: ['role']
    })

     // 3. Tạo danh sách recipient
    const recipients: Partial<NotificationRecipient>[] = users.map((user) => ({
      user,
      notification: notif,
      channels: [Channel.IN_APP, Channel.PUSH],
    }));

    // 4. Bulk insert
    await this.notifRecipientRepository.insert(recipients);
    // 2. Phát qua socket
    if (roles && roles.length > 0) {
      for (const role in roles) {
        this.gateway.server.to(`role:${role}`).emit('notification:new', {
          title,
          content,
          timestamp: new Date()
        })
      }
    } else {
      // In case don't defined role
      this.gateway.server.emit('notification:new', {
        title,
        content,
        timestamp: new Date(),
      });
    }

    

    return { ok: true, count: users.length };
  }
  // async updateSetAdmin(userId: number, data: UpdateSetDTO) {
    
  // }

  // async updateSet(id: number, dto: UpdateSetDTO) {
  //   const set = await this.setRepository.findOne({
  //     where: { set_id: id },
  //     relations: ['card', 'user'],
  //   });
  //   if (!set) throw new NotFoundException('Set not found');

  //   // (Ví dụ) cập nhật thông tin
  //   // Object.assign(set, dto);
  //   // return this.setRepository.save(set);
  //   return 'ok';
  // }

  // async notifySetUpdated(setId: number, updatedSet: any) {
  //   // Lấy danh sách user đã học ít nhất 1 thẻ trong set này
  //   const userIds = await this.reviewRepository
  //     .createQueryBuilder('review')
  //     .leftJoin('review.card', 'card')
  //     .select('DISTINCT review.user_id', 'user_id')
  //     .where('card.set_id = :setId', { setId })
  //     .getRawMany();

  //   for (const row of userIds) {
  //     await this.notificationRepository.save(
  //       this.notificationRepository.create({
  //         user: { id: row.user_id },
  //         type: 'set_updated',
  //         content: `Bộ từ '${updatedSet.name}' vừa được cập nhật. Hãy ôn lại nhé!`,
  //         data: { setId },
  //       }),
  //     );
  //   }
  // }
}
