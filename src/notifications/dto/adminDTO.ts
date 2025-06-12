import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSetDTO {
  @ApiProperty({
    description: 'New word',
    example: 'hi',
  })
  @IsNotEmpty({ message: "If front_text, can't be null" })
  front_text: string;

  @ApiProperty({
    description: 'The vietnamese meaning of this word',
    example: 'chào',
  })
  @IsNotEmpty({ message: "If back_text, can't be null" })
  back_text: string;

  @ApiProperty({
    description: 'Example',
    example: "Hi I'm Nam",
  })
  @IsNotEmpty({ message: "If example, can't be null" })
  example: string;
}
