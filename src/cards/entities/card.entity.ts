import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserCardReview } from './review.entity';
import { Set } from '../../sets/entities';
import { Topic } from '../../topics/entities';
import { User } from '../../users/entities';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn()
  card_id: number;

  @Column()
  front_text: string;

  @Column()
  back_text: string;

  @Column()
  ipa_pronunciation: string;

  @Column()
  example: string;

  @Column()
  example_meaning: string;

  @Column({ type: 'text', nullable: true })
  grammar_markdown: string;
  // @Column()
  // is_learned: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Foreign key
  @ManyToOne(() => Set, (set) => set.cards)
  @JoinColumn({ name: 'set_id' })
  set: Set;

  // Foreign key
  @ManyToOne(() => Topic, (topic) => topic.cards)
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @ManyToOne(() => User, (user) => user.cards, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => UserCardReview, (review) => review.card)
  userReviews: UserCardReview[];
}
