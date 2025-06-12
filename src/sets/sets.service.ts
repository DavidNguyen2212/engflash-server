import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, LessThanOrEqual } from 'typeorm';
import { Set } from './entities';
import { Card, UserCardReview } from 'src/cards/entities';
import { User } from 'src/users/entities';

@Injectable()
export class SetsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Set)
    private setRepository: Repository<Set>,
    @InjectRepository(UserCardReview)
    private reviewRepository: Repository<UserCardReview>,
  ) {}

  async getAllSetsByUser(user_id: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: Number(user_id),
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ${user_id} not found!`);
    }

    if (!user.defaultSetsLoaded) {
      // Get default topics
      const defaultSets = await this.setRepository.find({});

      // Cloning by transaction
      await this.dataSource.transaction(async (manager) => {
        user.defaultSetsLoaded = true;
        await manager.save(user);

        for (const defSet of defaultSets) {
          const clonedSet = manager.create(Set, {
            set_name: defSet.set_name,
            set_description: defSet.set_description,
            user: user,
          });
          await manager.save(clonedSet);

          const defaultCards = await this.cardRepository.find({
            where: {
              user: IsNull(),
              set: { set_id: defSet.set_id },
            },
          });

          if (defaultCards.length > 0) {
            const clonedCards = defaultCards.map((card) => {
              const { card_id, ...rest } = card;
              return manager.create(Card, {
                ...rest,
                set: clonedSet,
                user: user,
              });
            });
            await manager.save(clonedCards);
          }
        }
      });
    }

    // const sets = await this.setRepository
    //       .createQueryBuilder('set')
    //       .leftJoin('set.cards', 'card')
    //       .where('card.user_id = :user_id', { user_id })
    //       .orderBy('set.set_id', 'ASC')
    //       .getMany()
    const sets = await this.setRepository.find({
      where: { user: { id: Number(user_id) } },
      order: { set_id: 'ASC' },
      // relations: ['cards'], // nếu cần preload cards
    });

    return { sets };
  }

  async getAllCardsfromSet(user_id: string, set_id: number) {
    const set = await this.setRepository.findOne({
      where: {
        set_id: set_id,
      },
    });

    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .where('card.set_id = :set_id AND card.user_id = :user_id', {
        set_id,
        user_id,
      })
      .getMany();

    return { cards, set };
  }

  async reviseSetCards(userId: string, setId: number) {
    const today = new Date();
    // today.setHours(0, 0, 0, 0); // Để so sánh chính xác đến ngày

    const cardsToReview = await this.reviewRepository.find({
      where: {
        user: { id: Number(userId) },
        card: {
          set: { set_id: setId },
        },
        next_review_date: LessThanOrEqual(today),
      },
      relations: ['card', 'choices'],
    });

    if (!cardsToReview || cardsToReview.length === 0) {
      throw new NotFoundException(
        `No cards to review in topic ${setId} for user ${userId}`,
      );
    }

    const deck = cardsToReview.map((review) => ({
      card: review.card,
      choices: review.choices.map((c) =>
        Object({ key: c.text, value: c.isCorrect }),
      ), // from DB, no need OpenAI anymore
    }));

    return deck;
  }
}
