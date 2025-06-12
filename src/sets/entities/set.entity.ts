import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Card } from '../../cards/entities/card.entity'; // Import entity Card
import { User } from '../../users/entities';


@Entity('sets') // Tên bảng trong cơ sở dữ liệu là 'sets'
export class Set {
  @PrimaryGeneratedColumn()
  set_id: number;

  @Column()
  set_name: string;

  @Column()
  set_description: string;

  // Mối quan hệ một-đến-nhiều với Card
  @OneToMany(() => Card, (card) => card.set)
  cards: Card[]; // Mảng các Card thuộc Set này

  @ManyToOne(() => User, (user) => user.sets, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
