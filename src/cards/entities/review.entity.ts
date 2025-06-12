import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Card } from './card.entity';
import { User } from '../../users/entities';

@Entity('user_card_reviews')
export class UserCardReview {
  @PrimaryGeneratedColumn()
  id: number;

  // Quan hệ với User
  @ManyToOne(() => User, (user) => user.cardReviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Quan hệ với Card
  @ManyToOne(() => Card, (card) => card.userReviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  // Độ dễ của card đối với người dùng
  @Column({ type: 'float', default: 2.5 })
  ease_factor: number;

  // Khoảng thời gian ôn tập (tính bằng ngày)
  @Column({ type: 'integer', default: 0 })
  interval: number;

  // Số lần ôn tập thành công liên tiếp
  @Column({ type: 'integer', default: 0 })
  repetitions: number;

  // Ngày ôn tập tiếp theo
  @Column({ type: 'date', nullable: true })
  next_review_date: Date;

  // Ngày ôn tập gần nhất
  @Column({ type: 'date', nullable: true })
  last_review_date: Date;

  @OneToMany(() => UserCardReviewChoice, (choice) => choice.review, {
    cascade: true,
  })
  choices: UserCardReviewChoice[];
}

@Entity('user_card_review_choices')
export class UserCardReviewChoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column({ default: false })
  isCorrect: boolean;

  @ManyToOne(() => UserCardReview, (review) => review.choices, {
    onDelete: 'CASCADE',
  })
  review: UserCardReview;
}

@Entity('user_card_review_logs')
export class UserCardReviewLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Card, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @Column({ type: 'varchar', length: 10 })
  rating: 'good' | 'again';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  reviewed_at: Date;
}
