
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Card } from '../../cards/entities';
import { User } from '../../users/entities';

@Entity('topics') // Tên bảng trong cơ sở dữ liệu là 'topics'
export class Topic {
  @PrimaryGeneratedColumn()
  topic_id: number;

  @Column()
  topic_name: string;

  @Column()
  topic_description: string;

  @Column()
  is_default: boolean;

  // Mối quan hệ một-đến-nhiều với Card
  @OneToMany(() => Card, (card) => card.topic)
  cards: Card[]; // Mảng các Card thuộc Set này

  @ManyToOne(() => User, (user) => user.topics, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
