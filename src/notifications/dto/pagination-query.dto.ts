import { IsBooleanString, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsPositive()
  @Type(() => Number)
  limit = 20;

  @IsPositive()
  @Type(() => Number)
  page = 1;               // 1-based

  @IsOptional()
  @IsBooleanString()
  unreadOnly?: 'true' | 'false';
}

