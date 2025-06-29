import { IsOptional } from "class-validator";

// (nếu sau này muốn filter tuỳ loại)
export class MarkReadAllDto {
    @IsOptional()
    before?: Date;          // mark tất cả trước thời điểm X
  }