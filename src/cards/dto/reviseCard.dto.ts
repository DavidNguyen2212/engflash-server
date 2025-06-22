import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { ReviewEventType, ReviewRating } from '../entities';

// @AtLeastOneFieldDefined({ message: 'Phải cung cấp ít nhất một trường: front_text, back_text, hoặc example' })
export class ReviewCardDTO {
  @ApiProperty({
    description: 'ID of the card',
    example: 2,
  })
  @IsInt()
  card_id: number;

  @ApiProperty({
    description: `'again' = quẹt trái, 'good' = quẹt phải, 'correct': trả lời đúng ở review, 'wrong' thì ngược lại`,
    example: 'again or good',
  })
  @IsIn([ReviewRating.GOOD, ReviewRating.AGAIN, ReviewRating.CORRECT, ReviewRating.WRONG]) // 'again' = quẹt trái, 'good' = quẹt phải, 'correct': trả lời đúng ở review, 'wrong' thì ngược lại
  rating: ReviewRating;

  @ApiProperty({
    description: `'again' = quẹt trái, 'good' = quẹt phải, 'correct': trả lời đúng ở review, 'wrong' thì ngược lại`,
    example: 'again or good',
  })
  @IsIn([ReviewEventType.LEARN, ReviewEventType.REVIEW]) // 'again' = quẹt trái, 'good' = quẹt phải, 'correct': trả lời đúng ở review, 'wrong' thì ngược lại
  event_type: ReviewEventType;
}

export class ReviseCardDTO {
  @IsNotEmpty({ message: 'card_id is required' })
  card_id: number;

  // @IsOptional()
  @IsNotEmpty({ message: 'Topic id is required' })
  front_text: string;

  @IsOptional()
  @IsNotEmpty({ message: "If back_text, can't be null" })
  back_text?: string;

  @IsOptional()
  @IsNotEmpty({ message: "If example, can't be null" })
  example?: string;
}
