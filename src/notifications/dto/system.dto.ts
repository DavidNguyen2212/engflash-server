import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSystemNotificationDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  content: string;

  @IsOptional()
  linkTo?: string;          // deep-link, nếu có
}