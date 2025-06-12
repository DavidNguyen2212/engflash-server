import { Card, Topic, Set } from '../../cards/entities';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { UserCardReview } from '../../cards/entities';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserDailyActivity } from '../../statistics/entities';
import { Notification } from '../../notifications/entities';
import { Role } from '../../role/entities';


@Entity('users')
export class User extends BaseEntity {
  // Trường này auto primary key
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true, length: 6 })
  verificationCode: string;

  @Column({ nullable: true })
  verificationCodeExpiresAt: Date;

  @Column({ nullable: true, length: 6 })
  passwordResetCode: string;

  @Column({ nullable: true })
  passwordResetCodeExpiresAt: Date;

  @Column({ default: 0 })
  resetCodeAttempts: number;

  @Column({ default: false })
  canResetPassword: boolean;

  @Column({ nullable: true })
  defaultTopicsLoaded: boolean;

  @Column({ nullable: true })
  defaultSetsLoaded: boolean;

  @OneToMany(() => Card, (card) => card.user)
  cards: Card[];

  // Quan hệ mới với UserCardReview
  @OneToMany(() => UserCardReview, (review) => review.user)
  cardReviews: UserCardReview[];

  @Column({ nullable: true })
  lastLogin: Date;

  @OneToMany(() => Topic, (topic) => topic.user)
  topics: Topic[];

  @OneToMany(() => Set, (set) => set.user)
  sets: Set[];

  @OneToMany(() => UserDailyActivity, (activity) => activity.user)
  dailyActivities: UserDailyActivity[];

  @OneToMany(() => Notification, (notif) => notif.user)
  notifications: Notification[];

  // Eager giúp tự động load roles khi truy xuất user, mà bạn không cần gọi .find({ relations: ["roles"] })
  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({ name: 'user_roles', joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles: Role[]

  // Thêm hai helper method để check row cho nhanh
  hasRole(roleName: string): boolean {
    return this.roles?.some((role) => role.name === roleName) || false
  }

  getRoleNames(): string[] {
    return this.roles?.map((role) => role.name) || []
  }
}
