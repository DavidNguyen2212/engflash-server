// notifications/dto/notification-recipient.dto.ts
import { Expose, Transform, Type } from 'class-transformer';
import { NotificationType } from '../interface/notif.enum';

// Nested DTO chứa nội dung gốc
export class NotificationDTO {
  @Expose()
  id: number;

  @Expose()
  type: NotificationType;

  @Expose()
  title?: string;

  @Expose()
  content: string;

  @Expose()
  linkTo?: string;

  @Expose()
  data?: Record<string, any>;

  @Expose()
  createdAt: Date;
}


export class NotificationRecipientDTO {
  @Expose()
  id: number; // id của recipient record

  @Expose()
  @Type(() => NotificationDTO)
  notification: NotificationDTO;

  @Expose()
  readAt: Date | null;

  @Expose()
  deliveredAt: Date | null;

  @Expose()
  dueAt: Date | null;

  @Expose()
  createdAt: Date;
}

