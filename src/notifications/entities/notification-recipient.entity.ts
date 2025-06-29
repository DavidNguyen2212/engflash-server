import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities";
import { Channel } from "../interface/notif.enum";
import { Notification } from "./notification.entity";

/**
 * Bảng phức hợp (notifId + userId) đóng vai trò là bản sao của template dành cho người dùng
 * 
 * User ↔ NotificationRecipient	Một user có nhiều recipient notifications
 * 
 * Notification ↔ NotificationRecipient	Một notification được gửi cho nhiều user
 * 
 * NotificationRecipient	là bảng nối 1-N: user nhận một notification cụ thể
 * 
 * User ---< NotificationRecipient >--- Notification
 * 
 * readAt là cột nullable → bạn có thể kết hợp partial index nếu dùng raw SQL:
 * 
 * CREATE INDEX unread_notif_idx ON notification_recipient(user_id)
WHERE read_at IS NULL;
 */
@Index(['user', 'readAt']) // query unread
@Index(['dueAt']) // worker SRS
@Index(['user']) // query tất cả của user
@Index(['notification', 'user'], { unique: true }) // optional: chống duplicate
@Entity()
export class NotificationRecipient {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Notification, (notification) => notification.recipients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: Channel,
    array: true,
    default: [Channel.IN_APP, Channel.PUSH],
  })
  channels: Channel[];

  @Column({ type: 'timestamptz', nullable: true })
  dueAt?: Date;           // cho SRS_REVIEW

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date;     // worker FCM cập nhật

  @Column({ type: 'timestamptz', nullable: true })
  readAt?: Date;          // FE gửi PATCH

  @CreateDateColumn()
  createdAt: Date;
}