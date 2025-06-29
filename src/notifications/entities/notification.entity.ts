import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationRecipient } from './notification-recipient.entity';
import { Channel, NotificationType } from '../interface/notif.enum';


/**
 * Tóm lại, với cá nhân + broadcast + nhóm, mô hình Notification (template) ⬌ NotificationRecipient 
 * (trạng thái người nhận) là đơn giản, mở rộng và truy vấn hiệu quả nhất.
 * Tức, bảng notification này đóng vai trò template.
 * Bảng kia là id phức (notifId + userId) đóng vai trò là bản sao của template dành cho người dùng.
 */
@Entity()
@Index(['notif_type']) // nếu hay query theo loại thông báo (ex: SYSTEM, REMINDER)
@Index(['dueAt'])                // phục vụ worker SRS
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => NotificationRecipient, (recipient) => recipient.notification, { cascade: true })
  recipients: NotificationRecipient[];

  @Column({ type: 'enum', enum: NotificationType })
  notif_type: NotificationType;

  // Nội dung hiển thị
  @Column({ nullable: true })
  title?: string;

  @Column({ type: 'text' })
  content: string;

  // Link cho FE (nếu có)
  @Column({ nullable: true })
  linkTo?: string;

  // Data thô tuỳ use-case (ex: {setId:123})
  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  // --- Thời điểm luồng ---
  @Column({ type: 'timestamptz', nullable: true })
  dueAt?: Date;          // áp dụng cho SRS_REVIEW

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date;    // worker FCM cập nhật

  // Kênh gửi
  @Column({
    type: 'enum',
    enum: Channel,
    array: true,
    default: [Channel.IN_APP, Channel.PUSH],
  })
  channels: Channel[];

  // Audit
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
