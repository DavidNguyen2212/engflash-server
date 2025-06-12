import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Validate } from 'class-validator';

export class AIExampleDTO {
  @ApiPropertyOptional({
    description: 'The English word',
    example: 'hello',
  })
  // @IsOptional()
  @IsNotEmpty({ message: "If front_text, can't be null" })
  front_text: string;

  // @IsOptional()
  @ApiPropertyOptional({
    description: 'Vietnamese meaning of the word',
    example: 'xin chào',
  })
  @IsNotEmpty({ message: "If back_text, can't be null" })
  back_text: string;
}

export class ModifyExampleDTO {
  // Must separate ApiPropertyOptional (just for displaying) and IsOptional (real validation)
  @ApiProperty({
    description: 'ID of the card',
    example: 1,
  })
  @IsNotEmpty({ message: 'card_id is required' })
  card_id: number;

  @ApiPropertyOptional({
    description: 'The English word',
    example: 'hello',
  })
  // @IsOptional()
  @IsNotEmpty({ message: "If front_text, can't be null" })
  front_text: string;

  @ApiPropertyOptional({
    description: 'Vietnamese meaning of the word',
    example: 'xin chào',
  })
  @IsOptional()
  @IsNotEmpty({ message: "If back_text, can't be null" })
  back_text?: string;

  @ApiPropertyOptional({
    description: 'English example of the word',
    example: 'hello from Vietnam',
  })
  @IsOptional()
  @IsNotEmpty({ message: "If example, can't be null" })
  example?: string;

  @ApiPropertyOptional({
    description: 'English example of the word',
    example: 'hello from Vietnam',
  })
  @IsOptional()
  @IsNotEmpty({ message: "If example_meaning, can't be null" })
  example_meaning?: string;
}
