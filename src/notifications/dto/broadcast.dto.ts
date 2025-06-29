import { IsArray, IsOptional, IsString } from "class-validator";

export class BroadcastNotificationDto {
    @IsString()
    title: string;
  
    @IsString()
    content: string;
  
    @IsOptional()
    @IsArray()
    roles?: string[]; // Gửi theo role ('user', 'admin'), hoặc để trống là gửi toàn bộ
}