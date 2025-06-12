import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddCardDTO {
  @ApiProperty({
    description: 'The English word',
    example: 'hi',
  })
  @IsNotEmpty({ message: "If front_text, can't be null" })
  front_text: string;

  @ApiProperty({
    description: 'The vietnamese meaning of this word',
    example: 'chào',
  })
  @IsOptional()
  @IsNotEmpty({ message: "If back_text, can't be null" })
  back_text?: string;

  @ApiProperty({
    description: 'Example',
    example: "Hi I'm Nam",
  })
  @IsOptional()
  @IsNotEmpty({ message: "If example, can't be null" })
  example?: string;

  @ApiProperty({
    description: 'Topic that the word belongs to',
    example: 2,
  })
  topic_id: number | null;
  // @IsOptional()
  // @IsNotEmpty({ message: "if topic_id, can't be null"})
}

export class NewMeaningDTO {
  @ApiProperty({
    description: 'The word',
    example: 'run',
  })
  @IsNotEmpty({ message: "If front_text, can't be null" })
  front_text: string;

  @ApiProperty({
    description: 'The word',
    example: 'The motorcycle runs out of energy.',
  })
  @IsNotEmpty({ message: 'Must have a cover sentence' })
  cover_sentence: string;
}

export class SimpleCardDTO {
  @ApiProperty({
    description: 'ID of the card',
    example: 2,
  })
  @IsNumber()
  card_id: number;
}
